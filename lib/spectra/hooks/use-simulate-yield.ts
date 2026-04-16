"use client";

import { useCallback, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import BN from "bn.js";

import { getProgram } from "../program";
import { syncNav } from "../vault-client";

const BPS_DENOMINATOR = 10_000;

export function useSimulateYield(vaultId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const simulateYield = useCallback(
    async (currentTotalAssets: BN, deltaBps: number): Promise<string> => {
      setError(null);

      if (!wallet) {
        const err = new Error("Wallet not connected");
        setError(err);
        throw err;
      }

      const program = getProgram(connection, wallet);
      if (!program) {
        const err = new Error("Failed to initialize program");
        setError(err);
        throw err;
      }

      const numerator = currentTotalAssets
        .mul(new BN(BPS_DENOMINATOR + deltaBps));
      const nextTotalAssets = numerator.div(new BN(BPS_DENOMINATOR));
      const bounded = nextTotalAssets.isNeg() ? new BN(0) : nextTotalAssets;

      setLoading(true);
      try {
        const sig = await syncNav(
          program,
          vaultId,
          bounded,
          wallet.publicKey
        );

        queryClient.invalidateQueries({ queryKey: ["devnet-vault-dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["wallet-vault-positions"] });
        queryClient.invalidateQueries({ queryKey: ["spectra-vault", vaultId] });

        return sig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [connection, wallet, vaultId, queryClient]
  );

  return { simulateYield, loading, error };
}
