"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MetricPoint = { date: string; value: number; t: number };

/** Rolling timeline window for chart display. */
const LOOKBACK_DAYS = 15;
const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

function storageKey(wallet: string) {
  return `spectra_metric_history_v1_${wallet}`;
}

function loadFromStorage(wallet: string): MetricPoint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(wallet));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MetricPoint[];
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - LOOKBACK_MS;
    return parsed.filter(
      (p) =>
        p &&
        typeof p === "object" &&
        Number.isFinite(p.t) &&
        Number.isFinite(p.value) &&
        p.t >= cutoff,
    );
  } catch {
    return [];
  }
}

function saveToStorage(wallet: string, points: MetricPoint[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(wallet), JSON.stringify(points));
  } catch {
    // quota exceeded — silently ignore
  }
}

/**
 * Samples the latest metric on a fixed interval only (no burst appends on refetch).
 * Persists samples to localStorage keyed by wallet address so history survives
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
    if (!walletKey) {
      setPoints([]);
      seededRef.current = false;
      return;
    }
    const stored = loadFromStorage(walletKey);
    setPoints(stored);
    // If we already have points, consider it seeded (skip the initial append
    // until the interval fires, to avoid a duplicate same-second sample).
    seededRef.current = stored.length > 0;
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
      if (wk) saveToStorage(wk, next);
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
