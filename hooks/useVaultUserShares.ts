"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";

import {
  deriveSharesMintPda,
  deriveVaultPda,
  getUserShares,
} from "@/lib/spectra/vault-client";

const REFETCH_MS = 20_000;

export function useVaultUserShares(chainVaultId: number | null) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  return useQuery({
    queryKey: [
      "vault-user-shares",
      chainVaultId,
      connection.rpcEndpoint,
      publicKey?.toBase58() ?? "",
    ],
    queryFn: async () => {
      if (chainVaultId == null || !publicKey) return new BN(0);
      const [vaultPda] = deriveVaultPda(chainVaultId);
      const [sharesMint] = deriveSharesMintPda(vaultPda);
      return getUserShares(connection, sharesMint, publicKey);
    },
    enabled: connected && !!publicKey && chainVaultId != null,
    refetchInterval: REFETCH_MS,
    staleTime: 8000,
  });
}
