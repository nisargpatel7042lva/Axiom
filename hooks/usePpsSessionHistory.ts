"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type PpsPoint = { date: string; pps: number; t: number };

const MAX_POINTS = 96;

/**
 * Builds a lightweight session chart from live PPS polls (no fabricated history).
 * Samples keep appending on schedule even when PPS is unchanged.
 */
export function usePpsSessionHistory(livePps: number | null, pollMs = 20_000) {
  const [points, setPoints] = useState<PpsPoint[]>([]);

  const append = useCallback((pps: number) => {
    const t = Date.now();
    const date = new Date(t).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setPoints((prev) => {
      const next = [...prev, { date, pps, t }];
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
    });
  }, []);

  useEffect(() => {
    if (livePps == null || !Number.isFinite(livePps)) return;
    append(livePps);
    const id = window.setInterval(() => append(livePps), pollMs);
    return () => window.clearInterval(id);
  }, [livePps, pollMs, append]);

  const chartData = useMemo(() => {
    if (points.length >= 2) return points;
    if (livePps != null && Number.isFinite(livePps)) {
      const t = Date.now();
      return [
        {
          date: new Date(t - 60_000).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          pps: livePps,
          t: t - 60_000,
        },
        {
          date: new Date(t).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          pps: livePps,
          t,
        },
      ];
    }
    return [];
  }, [points, livePps]);

  return { chartData, pointCount: points.length };
}
