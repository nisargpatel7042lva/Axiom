import { PublicKey } from "@solana/web3.js";
import type { VaultMeta } from "./types";

export const SPECTRA_PROGRAM_ID = new PublicKey(
  "JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH"
);

export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

export const DEVNET_USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export const VAULT_IDS = {
  SAFE: 1,
  CONTRARIAN: 2,
  YIELD: 3,
} as const;

/** Share tokens use 9 decimals; USDC uses 6. */
export const SHARE_DECIMALS = 9;
export const USDC_DECIMALS = 6;

/** 10^(9-6) = 1000 — first-deposit decimal adjustment matching the on-chain constant. */
export const DECIMAL_ADJUSTMENT = 1_000;

/** PPS precision: 10^9, matching on-chain PPS_PRECISION. */
export const PPS_PRECISION = 1_000_000_000;

/** HWM initial value: 1.000000 (6-decimal fixed-point via PPS_PRECISION). */
export const INITIAL_HWM = 1_000_000_000;

// ---------------------------------------------------------------------------
// Jupiter Developer Platform (single API key for all Jupiter calls)
// ---------------------------------------------------------------------------

export const JUPITER_PRICE_API = "https://api.jup.ag/price/v2";
export const JUPITER_TOKENS_API = "https://api.jup.ag/tokens/v1/solana";
export const JUPITER_TRIGGER_API = "https://api.jup.ag/trigger/v1";
export const JUPITER_PREDICTION_API = "https://api.jup.ag/prediction/v1";

export function getNetwork(): "devnet" | "mainnet-beta" {
  const net = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  return net === "mainnet-beta" ? "mainnet-beta" : "devnet";
}

export function getUsdcMint(): PublicKey {
  return getNetwork() === "mainnet-beta" ? USDC_MINT : DEVNET_USDC_MINT;
}

export const VAULT_CATALOG: VaultMeta[] = [
  {
    id: VAULT_IDS.SAFE,
    name: "Safe Consensus",
    description:
      "Buys >85% probability events. Low risk, targets 8-15% APY through near-certain outcomes.",
    riskLevel: "Low",
    strategyType: 0,
  },
  {
    id: VAULT_IDS.CONTRARIAN,
    name: "Macro Contrarian",
    description:
      "Targets mispriced 40-65% probability events in politics & economics. Higher risk, higher reward.",
    riskLevel: "High",
    strategyType: 1,
  },
  {
    id: VAULT_IDS.YIELD,
    name: "Yield Maximizer",
    description:
      "70% in Jupiter Lend, 30% in >75% conviction predictions. Balanced yield generation.",
    riskLevel: "Medium",
    strategyType: 2,
  },
];
