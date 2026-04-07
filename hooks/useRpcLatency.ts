"use client";

import { useEffect, useRef, useState } from "react";
import { Connection } from "@solana/web3.js";

type Status = "good" | "degraded" | "down";

const ENDPOINT =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
    : "https://api.devnet.solana.com";

export function useRpcLatency(intervalMs = 30_000) {
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("good");
  const connRef = useRef<Connection | null>(null);

  useEffect(() => {
    if (!connRef.current) {
      connRef.current = new Connection(ENDPOINT, "confirmed");
    }
    const conn = connRef.current;

    async function ping() {
      const start = performance.now();
      try {
        await conn.getSlot();
        const elapsed = Math.round(performance.now() - start);
        setLatencyMs(elapsed);
        setStatus(elapsed < 400 ? "good" : elapsed < 1200 ? "degraded" : "down");
      } catch {
        setLatencyMs(null);
        setStatus("down");
      }
    }

    ping();
    const id = setInterval(ping, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { latencyMs, status };
}
