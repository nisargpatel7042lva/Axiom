"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getWalletBalances,
  getUsdcBalance,
  type TokenBalance,
} from "@/lib/services/dune-sim";
import { USDC_MINT_DEVNET } from "@/constants";

export function useWalletBalances() {
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58();

  const balancesQuery = useQuery<TokenBalance[]>({
    queryKey: ["dune-sim-balances", address],
    queryFn: () => getWalletBalances(address!),
    enabled: connected && !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const usdcQuery = useQuery<number>({
    queryKey: ["dune-sim-usdc", address],
    queryFn: () => getUsdcBalance(address!, USDC_MINT_DEVNET),
    enabled: connected && !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  return {
    balances: balancesQuery.data ?? [],
    usdcBalance: usdcQuery.data ?? 0,
    isLoading: balancesQuery.isLoading || usdcQuery.isLoading,
    error: balancesQuery.error ?? usdcQuery.error,
    refetch: () => {
      balancesQuery.refetch();
      usdcQuery.refetch();
    },
  };
}
