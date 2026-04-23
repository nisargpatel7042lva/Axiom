"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getTransactionHistory,
  type DuneTransaction,
} from "@/lib/services/dune-sim";
import { getSolanaRpcUrl } from "@/config/env";

async function getRpcFallbackHistory(
  address: string,
  limit: number,
): Promise<DuneTransaction[]> {
  try {
    const connection = new Connection(getSolanaRpcUrl(), "confirmed");
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(address),
      { limit },
      "confirmed",
    );

    return signatures.map((sig) => ({
      hash: sig.signature,
      block_number: sig.slot,
      block_time: sig.blockTime
        ? new Date(sig.blockTime * 1000).toISOString()
        : new Date().toISOString(),
      from: address,
      to: "",
      value: "0",
      success: sig.err == null,
      transaction_type: "svm",
      decoded: null,
    }));
  } catch {
    return [];
  }
}

export function useTransactionHistory(limit = 20) {
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58();

  const query = useQuery<DuneTransaction[]>({
    queryKey: ["dune-sim-txns", address, limit],
    queryFn: async () => {
      const dune = await getTransactionHistory(address!, limit);
      if (dune.length > 0) return dune;
      return getRpcFallbackHistory(address!, limit);
    },
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
