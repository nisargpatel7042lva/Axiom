"use client";

import { clusterApiUrl, Connection } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";

const FALLBACK = clusterApiUrl("mainnet-beta");

export type RpcHealthStatus = "good" | "degraded" | "down";

export function useRpcLatency() {
  const endpoint =
    process.env.NEXT_PUBLIC_RPCFAST_ENDPOINT?.trim() || FALLBACK;

  const connection = useMemo(
    () => new Connection(endpoint, "confirmed"),
    [endpoint],
  );

  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const measure = useCallback(async () => {
    const start = performance.now();
    try {
      await connection.getLatestBlockhash("confirmed");
      setFailed(false);
      setLatencyMs(Math.round(performance.now() - start));
    } catch {
      setFailed(true);
      setLatencyMs(null);
    }
  }, [connection]);

  useEffect(() => {
    void measure();
    const id = window.setInterval(() => {
      void measure();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [measure]);

  const status: RpcHealthStatus = failed
    ? "down"
    : latencyMs == null
      ? "degraded"
      : latencyMs < 200
        ? "good"
        : latencyMs < 500
          ? "degraded"
          : "degraded";

  if (failed) {
    return { latencyMs: null as number | null, status: "down" as const };
  }

  return { latencyMs, status };
}
