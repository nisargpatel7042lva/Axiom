"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type PpsPoint = { date: string; pps: number; t: number };

// Keep enough in-memory points for ~24h at ~20-22s polling.
const MAX_POINTS = 5000;
const STORAGE_PREFIX = "axiom:pps-history:";

/**
 * Builds a lightweight session chart from live PPS polls (no fabricated history).
 * Samples keep appending on schedule even when PPS is unchanged.
 */
export function usePpsSessionHistory(
  livePps: number | null,
  pollMs = 20_000,
  storageKey?: string,
) {
  const [points, setPoints] = useState<PpsPoint[]>([]);

  const scopedStorageKey = storageKey
    ? `${STORAGE_PREFIX}${storageKey}`
    : undefined;

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
    if (!scopedStorageKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(scopedStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PpsPoint[];
      if (!Array.isArray(parsed)) return;
      const now = Date.now();
      // Keep roughly one year of chart points for the "1y" selector.
      const cutoff = now - 365 * 24 * 60 * 60 * 1000;
      const clean = parsed.filter(
        (p) =>
          p &&
          typeof p.t === "number" &&
          Number.isFinite(p.t) &&
          p.t >= cutoff &&
          typeof p.pps === "number" &&
          Number.isFinite(p.pps) &&
          typeof p.date === "string",
      );
      if (clean.length > 0) {
        setPoints(clean.slice(-MAX_POINTS));
      }
    } catch {
      // Ignore malformed local cache.
    }
  }, [scopedStorageKey]);

  useEffect(() => {
    if (!scopedStorageKey || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(scopedStorageKey, JSON.stringify(points));
    } catch {
      // Ignore storage quota / write errors.
    }
  }, [points, scopedStorageKey]);

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
