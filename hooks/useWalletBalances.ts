"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  getWalletBalances,
  type TokenBalance,
} from "@/lib/services/dune-sim";
import { getUsdcMint, USDC_DECIMALS } from "@/lib/spectra/constants";

export function useWalletBalances() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58();
  const usdcMintStr = getUsdcMint().toBase58();

  const balancesQuery = useQuery<TokenBalance[]>({
    queryKey: ["dune-sim-balances", address],
    queryFn: () => getWalletBalances(address!),
    enabled: connected && !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  /** On-chain USDC (or `NEXT_PUBLIC_USDC_MINT`) so devnet / testnet Test USDC matches the vault. */
  const usdcQuery = useQuery<number>({
    queryKey: ["onchain-usdc", connection.rpcEndpoint, address, usdcMintStr],
    queryFn: async () => {
      if (!publicKey) return 0;
      const mint = getUsdcMint();
      const ata = getAssociatedTokenAddressSync(
        mint,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
      );
      try {
        const acc = await getAccount(
          connection,
          ata,
          "confirmed",
          TOKEN_PROGRAM_ID,
        );
        return Number(acc.amount) / 10 ** USDC_DECIMALS;
      } catch {
        return 0;
      }
    },
    enabled: connected && !!publicKey,
    staleTime: 10_000,
    refetchInterval: 25_000,
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
