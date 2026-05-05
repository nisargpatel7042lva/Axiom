"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchMetricHistory,
  upsertMetricHistory,
  type MetricPoint,
} from "@/lib/portfolio/metric-history";
import { isSupabaseEnabled } from "@/lib/supabase/client";
export type { MetricPoint } from "@/lib/portfolio/metric-history";

/** Rolling timeline window for chart display. */
const LOOKBACK_DAYS = 15;
const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

function loadLocalMetricHistory(wallet: string, cutoffMs: number): MetricPoint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`portfolio-metric-history-${wallet}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MetricPoint[];
    return parsed
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.value) && p.t >= cutoffMs)
      .sort((a, b) => a.t - b.t);
  } catch {
    return [];
  }
}

function persistLocalMetricHistory(wallet: string, points: MetricPoint[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`portfolio-metric-history-${wallet}`, JSON.stringify(points));
  } catch {
    // Ignore localStorage failures.
  }
}

function mergeMetricPoints(remote: MetricPoint[], local: MetricPoint[]): MetricPoint[] {
  const merged = new Map<number, MetricPoint>();
  for (const point of remote) {
    merged.set(point.t, point);
  }
  for (const point of local) {
    if (!merged.has(point.t)) {
      merged.set(point.t, point);
    }
  }
  return Array.from(merged.values()).sort((a, b) => a.t - b.t);
}

/**
 * Samples the latest metric on a fixed interval only (no burst appends on refetch).
 * Persists samples to Supabase keyed by wallet address so history survives
 * page refreshes and stays consistent across environments for the same wallet.
 */
export function useLiveMetricHistory(
  value: number | null,
  sampleMs = 24 * 60 * 60 * 1000,
  walletKey?: string | null,
) {
  const [points, setPoints] = useState<MetricPoint[]>([]);
  const valueRef = useRef<number | null>(null);
  valueRef.current = value;
  const seededRef = useRef(false);
  const walletRef = useRef(walletKey ?? null);
  walletRef.current = walletKey ?? null;

  // Load persisted history when wallet becomes available
  useEffect(() => {
    let active = true;
    seededRef.current = false;
    setPoints([]);

    if (!walletKey) {
      return undefined;
    }

    const load = async () => {
      const cutoff = Date.now() - LOOKBACK_MS;
      const local = loadLocalMetricHistory(walletKey, cutoff);

      if (!isSupabaseEnabled()) {
        if (!active) return;
        setPoints(local);
        seededRef.current = local.length > 0;
        return;
      }

      const remote = await fetchMetricHistory(walletKey, cutoff);
      if (!active) return;

      const merged = mergeMetricPoints(remote, local);
      if (!active) return;
      setPoints(merged);
      seededRef.current = merged.length > 0;
      persistLocalMetricHistory(walletKey, merged);

      if (local.length > 0) {
        const remoteTs = new Set(remote.map((point) => point.t));
        for (const point of local) {
          if (!remoteTs.has(point.t)) {
            void upsertMetricHistory(walletKey, point);
          }
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [walletKey]);

  const append = useCallback((nextValue: number) => {
    const t = Date.now();
    const date = new Date(t).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
    });

    setPoints((prev) => {
      const cutoff = t - LOOKBACK_MS;
      // Dedupe: if the most recent sample is from the same calendar day, replace it
      // (guards against duplicate same-day samples on remount / hot-reload).
      const todayKey = `${new Date(t).getFullYear()}-${new Date(t).getMonth()}-${new Date(t).getDate()}`;
      const withoutToday = prev.filter((p) => {
        const d = new Date(p.t);
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return k !== todayKey && p.t >= cutoff;
      });
      const next = [...withoutToday, { date, value: nextValue, t }];
      const wk = walletRef.current;
      if (wk) {
        persistLocalMetricHistory(wk, next);
        if (isSupabaseEnabled()) {
          void upsertMetricHistory(wk, { date, value: nextValue, t });
        }
      }
      return next;
    });
  }, []);

  // Seed with the first valid value when wallet is fresh (no stored history)
  useEffect(() => {
    if (value == null || !Number.isFinite(value)) {
      if (!walletKey) seededRef.current = false;
      return;
    }
    if (!seededRef.current) {
      seededRef.current = true;
      append(value);
    }
  }, [value, walletKey, append]);

  // Periodic sample on interval
  useEffect(() => {
    if (!Number.isFinite(sampleMs) || sampleMs < 60_000) return;

    const tick = () => {
      const v = valueRef.current;
      if (v == null || !Number.isFinite(v)) return;
      append(v);
    };

    const id = window.setInterval(tick, sampleMs);
    return () => window.clearInterval(id);
  }, [sampleMs, append]);

  return points;
}
