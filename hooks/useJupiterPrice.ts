"use client";

import { useQuery } from "@tanstack/react-query";
import { getTokenPrices } from "@/lib/services/jupiter";

export function useJupiterPrices(mintIds: string[]) {
  return useQuery<Record<string, number>>({
    queryKey: ["jupiter-prices", ...mintIds],
    queryFn: () => getTokenPrices(mintIds),
    enabled: mintIds.length > 0,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useJupiterPrice(mintId: string | undefined) {
  const query = useJupiterPrices(mintId ? [mintId] : []);
  const price = mintId ? (query.data?.[mintId] ?? 0) : 0;

  return {
    price,
    isLoading: query.isLoading,
    error: query.error,
  };
}
