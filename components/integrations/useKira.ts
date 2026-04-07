"use client";

import { useCallback, useState } from "react";

import {
  STUB_KIRA_QUOTE,
  STUB_KIRA_STATUS,
} from "@/components/integrations/stubData";

import type { ChainId, KiraDepositQuote, KiraDepositStatus } from "@/types/index";
import Decimal from "decimal.js";

/**
 * Stub until Agent 4 provides the real hook.
 */
export function useKira(): {
  quote: KiraDepositQuote | null;
  depositStatus: KiraDepositStatus | null;
  getDepositQuote: (input: {
    chain: ChainId;
    token: string;
    amount: Decimal;
  }) => Promise<void>;
  isLoadingQuote: boolean;
} {
  const [quote, setQuote] = useState<KiraDepositQuote | null>(null);
  const [depositStatus, setDepositStatus] = useState<KiraDepositStatus | null>(
    null,
  );
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const getDepositQuote = useCallback(
    async (input: { chain: ChainId; token: string; amount: Decimal }) => {
      setIsLoadingQuote(true);
      await new Promise((r) => setTimeout(r, 600));
      const quoteId = `kira_${Date.now()}`;
      setQuote({
        ...STUB_KIRA_QUOTE,
        sourceChain: input.chain,
        sourceAsset: input.token,
        amountIn: input.amount,
        quoteId,
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      });
      setDepositStatus({
        ...STUB_KIRA_STATUS,
        quoteId,
        status: "awaiting_funds",
      });
      setIsLoadingQuote(false);
    },
    [],
  );

  return { quote, depositStatus, getDepositQuote, isLoadingQuote };
}
