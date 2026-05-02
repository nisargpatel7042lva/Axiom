"use client";

import { useState, useCallback } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import BN from "bn.js";

import { getProgram } from "../program";
import { withdraw as sendWithdraw } from "../vault-client";
import { trackEvent } from "@/lib/analytics/client";

type WithdrawTelemetryMeta = {
  attemptId?: string;
  wallet?: string;
  vaultId?: string;
  shares?: number;
};

export function useWithdraw(vaultId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const withdraw = useCallback(
    async (shares: BN, meta?: WithdrawTelemetryMeta): Promise<string> => {
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
        trackEvent({
          name: "withdraw_tx_confirmed",
          attemptId: meta?.attemptId,
          wallet: meta?.wallet ?? wallet.publicKey.toBase58(),
          vaultId: meta?.vaultId,
          chainVaultId: vaultId,
          txKind: "withdraw",
          txSig: sig,
          shares: meta?.shares,
        });

        queryClient.invalidateQueries({ queryKey: ["devnet-vault-dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["wallet-vault-positions"] });
        queryClient.invalidateQueries({ queryKey: ["vault-user-shares"] });
        queryClient.invalidateQueries({ queryKey: ["onchain-usdc"] });
        queryClient.invalidateQueries({ queryKey: ["wallet-tx-history-merged"] });

        return sig;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        trackEvent({
          name: "withdraw_tx_failed",
          attemptId: meta?.attemptId,
          wallet: meta?.wallet ?? wallet.publicKey.toBase58(),
          vaultId: meta?.vaultId,
          chainVaultId: vaultId,
          txKind: "withdraw",
          shares: meta?.shares,
          errorClass: err.name,
          errorMessage: err.message,
        });
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
