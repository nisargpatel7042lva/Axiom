"use client";

import { useEffect, useState } from "react";

export type MetricPoint = { date: string; value: number; t: number };

const MAX = 72;

/** Append a sample whenever `value` changes (e.g. after each devnet refetch). */
export function useLiveMetricHistory(value: number | null) {
  const [points, setPoints] = useState<MetricPoint[]>([]);

  useEffect(() => {
    if (value == null || !Number.isFinite(value)) return;
    const t = Date.now();
    const date = new Date(t).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setPoints((prev) => {
      const next = [...prev, { date, value, t }];
      return next.length > MAX ? next.slice(-MAX) : next;
    });
  }, [value]);

  return points;
}
