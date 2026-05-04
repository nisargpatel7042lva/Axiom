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
  const warnedRef = useRef(false);

  // Load persisted history when wallet becomes available
  useEffect(() => {
    let active = true;

    if (!walletKey) {
      setPoints([]);
      seededRef.current = false;
      return undefined;
    }

    const load = async () => {
      if (!isSupabaseEnabled() && !warnedRef.current) {
        warnedRef.current = true;
        console.warn("Supabase is not configured; metric history will be empty.");
      }
      const cutoff = Date.now() - LOOKBACK_MS;
      const remote = await fetchMetricHistory(walletKey, cutoff);

      if (!active) return;

      setPoints(remote);
      seededRef.current = remote.length > 0;
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
      // Persist to localStorage if we have a wallet key
      const wk = walletRef.current;
      if (wk) void upsertMetricHistory(wk, { date, value: nextValue, t });
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
