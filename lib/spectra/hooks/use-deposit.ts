"use client";

import { useState, useCallback } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import BN from "bn.js";

import { getProgram } from "../program";
import { deposit as sendDeposit } from "../vault-client";

export function useDeposit(vaultId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deposit = useCallback(
    async (amount: BN): Promise<string> => {
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
        const sig = await sendDeposit(
          program,
          vaultId,
          amount,
          wallet.publicKey
        );

        await connection.confirmTransaction(sig, "confirmed");

        queryClient.invalidateQueries({ queryKey: ["devnet-vault-dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["wallet-vault-positions"] });
        queryClient.invalidateQueries({ queryKey: ["vault-user-shares"] });

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

  return { deposit, loading, error };
}
