"use client";

import { useState, useCallback, useRef } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import BN from "bn.js";

import { getProgram } from "../program";
import { deposit as sendDeposit } from "../vault-client";
import { trackEvent } from "@/lib/analytics/client";

type DepositTelemetryMeta = {
  attemptId?: string;
  wallet?: string;
  vaultId?: string;
  amountUsdc?: number;
};

export function useDeposit(vaultId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  const deposit = useCallback(
    async (amount: BN, meta?: DepositTelemetryMeta): Promise<string> => {
      setError(null);

      if (inFlight.current) {
        const err = new Error("Deposit already in progress");
        setError(err);
        throw err;
      }

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
      inFlight.current = true;
      try {
        const sig = await sendDeposit(
          program,
          vaultId,
          amount,
          wallet.publicKey
        );
        trackEvent({
          name: "deposit_tx_confirmed",
          attemptId: meta?.attemptId,
          wallet: meta?.wallet ?? wallet.publicKey.toBase58(),
          vaultId: meta?.vaultId,
          chainVaultId: vaultId,
          txKind: "deposit",
          txSig: sig,
          amountUsdc: meta?.amountUsdc,
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
          name: "deposit_tx_failed",
          attemptId: meta?.attemptId,
          wallet: meta?.wallet ?? wallet.publicKey.toBase58(),
          vaultId: meta?.vaultId,
          chainVaultId: vaultId,
          txKind: "deposit",
          amountUsdc: meta?.amountUsdc,
          errorClass: err.name,
          errorMessage: err.message,
        });
        setError(err);
        throw err;
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [wallet, vaultId, queryClient]
  );

  return { deposit, loading, error };
}
