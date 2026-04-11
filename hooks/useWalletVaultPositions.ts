"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";

import { VAULT_CONFIGS } from "@/constants";
import {
  fetchVaultSnapshot,
  mapOnChainToUiVaultState,
} from "@/lib/devnet-vault-data";
import {
  deriveVaultPda,
  deriveSharesMintPda,
  getUserShares,
  previewWithdraw,
} from "@/lib/spectra/vault-client";
import type { VaultId, VaultState } from "@/types";

const REFETCH_MS = 25_000;

export type LiveVaultPosition = {
  vaultId: VaultId;
  config: (typeof VAULT_CONFIGS)[number];
  sharesHuman: number;
  sharesLamports: BN;
  currentValueUsdc: number;
  uiState: VaultState | null;
  onChain: Awaited<ReturnType<typeof fetchVaultSnapshot>>;
};

export function useWalletVaultPositions() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const query = useQuery({
    queryKey: [
      "wallet-vault-positions",
      connection.rpcEndpoint,
      publicKey?.toBase58() ?? "",
    ],
    queryFn: async (): Promise<LiveVaultPosition[]> => {
      if (!publicKey) return [];

      const rows: LiveVaultPosition[] = [];

      for (const config of VAULT_CONFIGS) {
        const snapshot = await fetchVaultSnapshot(
          connection,
          config.chainVaultId
        );
        if (!snapshot) {
          rows.push({
            vaultId: config.id,
            config,
            sharesHuman: 0,
            sharesLamports: new BN(0),
            currentValueUsdc: 0,
            uiState: null,
            onChain: null,
          });
          continue;
        }

        const [vaultPda] = deriveVaultPda(config.chainVaultId);
        const [sharesMint] = deriveSharesMintPda(vaultPda);
        const sharesLamports = await getUserShares(
          connection,
          sharesMint,
          publicKey
        );

        const uiState = mapOnChainToUiVaultState(
          config.id,
          snapshot.onChain,
          snapshot.custodyLamports
        );

        const sharesHuman =
          Number(sharesLamports.toString(10)) / 10 ** 9;

        const { usdcToReceive } = previewWithdraw(
          snapshot.onChain,
          sharesLamports
        );
        const currentValueUsdc =
          Number(usdcToReceive.toString(10)) / 10 ** 6;

        rows.push({
          vaultId: config.id,
          config,
          sharesHuman,
          sharesLamports,
          currentValueUsdc,
          uiState,
          onChain: snapshot,
        });
      }

      return rows;
    },
    enabled: connected && !!publicKey,
    refetchInterval: REFETCH_MS,
    staleTime: 10_000,
    retry: 1,
  });

  const positions = useMemo(
    () => (query.data ?? []).filter((p) => p.sharesHuman > 0),
    [query.data]
  );

  const totalValue = useMemo(
    () => positions.reduce((s, p) => s + p.currentValueUsdc, 0),
    [positions]
  );

  return {
    all: query.data ?? [],
    positions,
    totalValue,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
