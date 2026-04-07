"use client";

import { useState } from "react";

import { STUB_PRICES, STUB_SOL_PRICE } from "@/components/integrations/stubData";

/**
 * Stub until Agent 3 provides the real hook.
 */
export function usePrices(): {
  prices: Record<string, number>;
  solPrice: number;
  isLoading: boolean;
} {
  const [isLoading] = useState(false);
  return { prices: STUB_PRICES, solPrice: STUB_SOL_PRICE, isLoading };
}
