import { PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

import { IDL } from "./idl";

export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

export function getNetwork(): SolanaCluster {
  const n = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.trim().toLowerCase();
  if (n === "mainnet-beta" || n === "mainnet") return "mainnet-beta";
  if (n === "testnet") return "testnet";
  return "devnet";
}

export const SPECTRA_PROGRAM_ID = new PublicKey(IDL.address);

export { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID };

/** Mirrors `programs/spectra-vault/src/constants.rs` for client preview math. */
export const SHARE_DECIMALS = 9;
export const DECIMAL_ADJUSTMENT = 1_000;
export const PPS_PRECISION = 1_000_000_000;

export const USDC_DECIMALS = 6;

/** Circle USDC (mainnet). */
export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);

/** Default devnet / test USDC; override with `NEXT_PUBLIC_USDC_MINT`. */
export const DEVNET_USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT?.trim() ||
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);

export function getUsdcMint(): PublicKey {
  return getNetwork() === "mainnet-beta" ? USDC_MINT : DEVNET_USDC_MINT;
}

/** On-chain numeric vault ids (PDAs / `initialize` order). */
export const VAULT_IDS = {
  SAFE: 1,
  CONTRARIAN: 2,
  YIELD: 3,
} as const;

export const VAULT_CATALOG: { id: number; name: string }[] = [
  { id: VAULT_IDS.SAFE, name: "Safe Consensus" },
  { id: VAULT_IDS.CONTRARIAN, name: "Macro Contrarian" },
  { id: VAULT_IDS.YIELD, name: "Yield Maximizer" },
];
