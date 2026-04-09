"use client";

import { useState, useCallback } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import BN from "bn.js";

import { getProgram } from "../program";
import { withdraw as sendWithdraw } from "../vault-client";

export function useWithdraw(vaultId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const withdraw = useCallback(
    async (shares: BN): Promise<string> => {
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

      setLoading(true);
      try {
        const sig = await sendWithdraw(
          program,
          vaultId,
          shares,
          wallet.publicKey
        );

        await connection.confirmTransaction(sig, "confirmed");

        queryClient.invalidateQueries({ queryKey: ["spectra-vault", vaultId] });
        queryClient.invalidateQueries({ queryKey: ["spectra-portfolio"] });

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

  return { withdraw, loading, error };
}
