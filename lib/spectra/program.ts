import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { IDL, type SpectraVault } from "./idl";

export function getProvider(
  connection: Connection,
  wallet: AnchorWallet
): AnchorProvider {
  return new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });
}

export function getProgram(
  connection: Connection,
  wallet: AnchorWallet | undefined | null
): Program<SpectraVault> | null {
  if (!wallet) return null;

  const provider = getProvider(connection, wallet);
  return new Program<SpectraVault>(IDL, provider);
}

/**
 * Read-only program instance for fetching account data without a connected
 * wallet. Uses a dummy wallet so the Provider can be constructed, but any
 * signing transaction will fail — use only for account reads.
 */
export function getReadonlyProgram(
  connection: Connection
): Program<SpectraVault> {
  const dummyWallet: AnchorWallet = {
    publicKey: PublicKey.default,
    signTransaction: () => {
      throw new Error("Read-only: wallet not connected");
    },
    signAllTransactions: () => {
      throw new Error("Read-only: wallet not connected");
    },
  };
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });
  return new Program<SpectraVault>(IDL, provider);
}
