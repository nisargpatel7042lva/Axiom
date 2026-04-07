"use client";

import { useCallback, useState } from "react";

import type { DodoPayout } from "@/types/index";

/**
 * Stub until Agent 4 provides the real hook.
 */
export function useDodo(): {
  startSubscription: () => void;
  requestPayout: (payload: {
    amountCents: number;
    recipientName: string;
    recipientEmail: string;
    currency: string;
  }) => Promise<void>;
  latestPayout: DodoPayout | null;
  isProcessing: boolean;
} {
  const [latestPayout, setLatestPayout] = useState<DodoPayout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startSubscription = useCallback(() => {
    // no-op stub
  }, []);

  const requestPayout = useCallback(
    async (payload: {
      amountCents: number;
      recipientName: string;
      recipientEmail: string;
      currency: string;
    }) => {
      setIsProcessing(true);
      await new Promise((r) => setTimeout(r, 800));
      setLatestPayout({
        id: `payout_${Date.now()}`,
        request: {
          amountCents: payload.amountCents,
          destination: { type: "ach", externalRef: "stub-ref" },
          idempotencyKey: crypto.randomUUID(),
        },
        status: "pending",
        initiatedAt: new Date().toISOString(),
      });
      setIsProcessing(false);
    },
    [],
  );

  return {
    startSubscription,
    requestPayout,
    latestPayout,
    isProcessing,
  };
}
