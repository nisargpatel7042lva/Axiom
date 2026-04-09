"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";

import { getReadonlyProgram } from "../program";
import {
  getVaultState,
  getUserShares,
  computePPS,
  deriveVaultPda,
  deriveSharesMintPda,
} from "../vault-client";
import { VAULT_IDS, VAULT_CATALOG, SHARE_DECIMALS } from "../constants";
import { getTokenPrices } from "@/lib/services/jupiter-price";
import type { UserVaultPosition } from "../types";

const POLL_INTERVAL_MS = 30_000;

const ALL_VAULT_IDS = [VAULT_IDS.SAFE, VAULT_IDS.CONTRARIAN, VAULT_IDS.YIELD];

export function usePortfolio() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const portfolioQuery = useQuery<
    {
      vaults: UserVaultPosition[];
      totalValue: number;
      totalPnl: number;
    },
    Error
  >({
    queryKey: ["spectra-portfolio", wallet?.publicKey?.toBase58() ?? ""],
    queryFn: async () => {
      if (!wallet) return { vaults: [], totalValue: 0, totalPnl: 0 };

      const program = getReadonlyProgram(connection);

      const vaultData = await Promise.all(
        ALL_VAULT_IDS.map(async (vaultId) => {
          const vault = await getVaultState(program, vaultId);
          const [vaultPda] = deriveVaultPda(vaultId);
          const [sharesMint] = deriveSharesMintPda(vaultPda);

          const sharesHeld = await getUserShares(
            connection,
            sharesMint,
            wallet.publicKey
          );

          return { vaultId, vault, sharesMint, sharesHeld };
        })
      );

      const heldVaults = vaultData.filter((v) => !v.sharesHeld.isZero());

      if (heldVaults.length === 0) {
        return { vaults: [], totalValue: 0, totalPnl: 0 };
      }

      // Jupiter Price API: fetch USD prices for held share token mints.
      // Falls back to on-chain PPS if the API is unavailable or the token
      // isn't listed (vault share tokens likely won't have market prices yet).
      const sharesMints = heldVaults.map((v) => v.sharesMint.toBase58());
      let jupiterPrices = new Map<string, number>();
      try {
        jupiterPrices = await getTokenPrices(sharesMints);
      } catch {
        // Jupiter Price API unavailable — fall back to on-chain PPS below
      }

      const positions: UserVaultPosition[] = heldVaults.map((v) => {
        const sharesFloat =
          v.sharesHeld.toNumber() / Math.pow(10, SHARE_DECIMALS);

        const jupPrice = jupiterPrices.get(v.sharesMint.toBase58());
        const pps = jupPrice ?? computePPS(v.vault);
        const currentValue = sharesFloat * pps;

        const meta = VAULT_CATALOG.find((m) => m.id === v.vaultId);

        return {
          vaultId: v.vaultId,
          vaultName: meta?.name ?? `Vault ${v.vaultId}`,
          sharesHeld: v.sharesHeld,
          currentValue,
          pnl: 0,
          depositedAmount: currentValue,
        };
      });

      const totalValue = positions.reduce((s, p) => s + p.currentValue, 0);
      const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);

      return { vaults: positions, totalValue, totalPnl };
    },
    enabled: !!wallet,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS / 2,
    retry: 2,
  });

  return {
    vaults: portfolioQuery.data?.vaults ?? [],
    totalValue: portfolioQuery.data?.totalValue ?? 0,
    totalPnl: portfolioQuery.data?.totalPnl ?? 0,
    loading: portfolioQuery.isLoading,
  };
}
