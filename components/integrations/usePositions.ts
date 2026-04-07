"use client";

import { useCallback, useState } from "react";

import { STUB_POSITIONS, STUB_TREASURY } from "@/components/integrations/stubData";

import type { LPPosition, TreasuryState } from "@/types/index";

/**
 * Stub until Agent 3 provides the real hook.
 * Replace import in dashboard with `@/hooks/usePositions` when available.
 */
export function usePositions(): {
  positions: LPPosition[];
  treasury: TreasuryState;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsLoading(false);
  }, []);

  return {
    positions: STUB_POSITIONS,
    treasury: STUB_TREASURY,
    isLoading,
    refetch,
  };
}
