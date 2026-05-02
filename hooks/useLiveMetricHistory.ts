"use client";

import { useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export type MetricPoint = { date: string; value: number; t: number };

const LOOKBACK_DAYS = 15;
const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

export function useLiveMetricHistory(value: number | null) {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();
  const [points, setPoints] = useState<MetricPoint[]>([]);
  const lastSavedValue = useRef<number | null>(null);
  const fetchedRef = useRef(false);

  // 1. Fetch from Supabase
  useEffect(() => {
    if (!walletAddress || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch(`/api/portfolio/snapshot?wallet=${walletAddress}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.snapshots && Array.isArray(data.snapshots)) {
          const cutoff = Date.now() - LOOKBACK_MS;
          const metricPoints = data.snapshots.map((s: any) => {
            const t = new Date(s.timestamp).getTime();
            return {
              t,
              date: new Date(t).toLocaleDateString("en-US", { day: "numeric", month: "long" }),
              value: s.total_value_usdc
            };
          }).filter((p: MetricPoint) => p.t >= cutoff);
          setPoints(metricPoints);
        }
      })
      .catch(console.error);
  }, [walletAddress]);

  // 2. Insert into Supabase when value changes significantly (Debounced/Conditional to avoid spam)
  useEffect(() => {
    if (!walletAddress || value == null || !Number.isFinite(value) || value <= 0) return;

    // Only save if it's the first save this session, or the value drifted by more than $0.10
    const drifted = lastSavedValue.current === null || Math.abs(lastSavedValue.current - value) > 0.1;
    if (!drifted) return;

    lastSavedValue.current = value;
    const t = Date.now();
    const date = new Date(t).toLocaleDateString("en-US", { day: "numeric", month: "long" });

    // Optimistic UI Update
    setPoints(prev => {
      const cutoff = t - LOOKBACK_MS;
      return [...prev, { date, value, t }].filter((p) => p.t >= cutoff);
    });

    // Background push to DB
    fetch(`/api/portfolio/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: walletAddress, total_value_usdc: value })
    }).catch(console.error);

  }, [value, walletAddress]);

  return points;
}
