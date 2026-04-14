"use client";

import { useCallback, useEffect, useState } from "react";

export type MetricPoint = { date: string; value: number; t: number };

/** Rolling timeline window for chart display. */
const LOOKBACK_DAYS = 15;
const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

/**
 * Appends time-series samples while a value is available.
 * Default sampling interval is 24h, so portfolio charts represent day-level history.
 */
export function useLiveMetricHistory(value: number | null, sampleMs = 24 * 60 * 60 * 1000) {
  const [points, setPoints] = useState<MetricPoint[]>([]);

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
    if (value == null || !Number.isFinite(value)) return;
    append(value);
    const id = window.setInterval(() => append(value), sampleMs);
    return () => window.clearInterval(id);
  }, [value, sampleMs, append]);

  return points;
}
