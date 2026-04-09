"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getTransactionHistory,
  type DuneTransaction,
} from "@/lib/services/dune-sim";

export function useTransactionHistory(limit = 20) {
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58();

  const query = useQuery<DuneTransaction[]>({
    queryKey: ["dune-sim-txns", address, limit],
    queryFn: () => getTransactionHistory(address!, limit),
    enabled: connected && !!address,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
