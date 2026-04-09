"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";

import { getReadonlyProgram } from "../program";
import {
  getVaultState,
  getStrategyConfig,
  deriveVaultPda,
} from "../vault-client";
import type { VaultState, StrategyConfig } from "../types";

const POLL_INTERVAL_MS = 30_000;

export function useVault(vaultId: number) {
  const { connection } = useConnection();

  const vaultQuery = useQuery<
    { vault: VaultState; strategy: StrategyConfig },
    Error
  >({
    queryKey: ["spectra-vault", vaultId],
    queryFn: async () => {
      const program = getReadonlyProgram(connection);
      const [vaultPda] = deriveVaultPda(vaultId);

      const [vault, strategy] = await Promise.all([
        getVaultState(program, vaultId),
        getStrategyConfig(program, vaultPda),
      ]);

      return { vault, strategy };
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS / 2,
    retry: 2,
  });

  return {
    vault: vaultQuery.data?.vault ?? null,
    strategy: vaultQuery.data?.strategy ?? null,
    loading: vaultQuery.isLoading,
    error: vaultQuery.error,
    refetch: vaultQuery.refetch,
  };
}
