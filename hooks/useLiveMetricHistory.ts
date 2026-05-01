"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MetricPoint = { date: string; value: number; t: number };

/** Rolling timeline window for chart display. */
const LOOKBACK_DAYS = 15;
const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

/**
 * Samples the latest metric on a fixed interval only (no burst appends on refetch).
 * Uses a ref so Solana / React Query refetches do not schedule duplicate samples.
 */
export function useLiveMetricHistory(value: number | null, sampleMs = 24 * 60 * 60 * 1000) {
  const [points, setPoints] = useState<MetricPoint[]>([]);
  const valueRef = useRef<number | null>(null);
  valueRef.current = value;
  const seededRef = useRef(false);

  const append = useCallback((nextValue: number) => {
    const t = Date.now();
    const date = new Date(t).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
    });

    setPoints((prev) => {
      const next = [...prev, { date, value: nextValue, t }];
      const cutoff = t - LOOKBACK_MS;
      return next.filter((p) => p.t >= cutoff);
    });
  }, []);

  useEffect(() => {
    if (value == null || !Number.isFinite(value)) {
      seededRef.current = false;
      return;
    }
    if (!seededRef.current) {
      seededRef.current = true;
      append(value);
    }
  }, [value, append]);

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
