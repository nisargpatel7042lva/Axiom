"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import {
  getWalletTransactionHistoryMerged,
  type DuneTransaction,
} from "@/lib/services/dune-sim";

const TX_HISTORY_STALE_MS = 20_000;
const TX_HISTORY_REFETCH_MS = 90_000;

export function useTransactionHistory(limit = 20) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58();

  const query = useQuery<DuneTransaction[]>({
    queryKey: ["wallet-tx-history-merged", connection.rpcEndpoint, address, limit],
    queryFn: async () => {
      const wallet = address!;
      return getWalletTransactionHistoryMerged(connection, wallet, limit);
    },
    enabled: connected && !!address,
    staleTime: TX_HISTORY_STALE_MS,
    refetchInterval: TX_HISTORY_REFETCH_MS,
  });

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
