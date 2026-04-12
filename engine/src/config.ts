import type { VaultConfig, VaultStrategyType } from "./types/index.js";

export const CONFIG = {
  RPC_URL: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  KEYPAIR_PATH: process.env.VAULT_AUTHORITY_KEYPAIR_PATH || "./keypair.json",

  // Single Jupiter Developer Platform API key for all Jupiter APIs
  JUPITER_API_KEY: process.env.JUPITER_API_KEY || process.env.JUPITER_PREDICTION_API_KEY || "",

  // Jupiter API base URLs (all routed through single developer key)
  JUPITER_PREDICTION_BASE: "https://api.jup.ag/prediction/v1",
  JUPITER_PRICE_BASE: "https://api.jup.ag/price/v2",
  JUPITER_TOKENS_BASE: "https://api.jup.ag/tokens/v1",
  JUPITER_TRIGGER_BASE: "https://api.jup.ag/trigger/v1",

  VAULT_PROGRAM_ID: process.env.VAULT_PROGRAM_ID || "JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH",
  USDC_MINT: process.env.USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",

  HEALTH_PORT: parseInt(process.env.HEALTH_PORT || "3001", 10),

  IDLE_BUFFER_PCT: 0.05,

  /** PROMPT 5 — AI market scorer */
  AI_ENABLED: process.env.AI_ENABLED !== "false",
  AI_PROVIDER: ((raw: string | undefined): "anthropic" | "openai" => {
    const p = (raw || "anthropic").toLowerCase();
    return p === "openai" ? "openai" : "anthropic";
  })(process.env.AI_PROVIDER),
  AI_API_KEY: process.env.AI_API_KEY || "",
  AI_MODEL:
    process.env.AI_MODEL ||
    ((process.env.AI_PROVIDER || "anthropic").toLowerCase() === "openai"
      ? "gpt-4o-mini"
      : "claude-3-5-haiku-20241022"),
  AI_MAX_CALLS_PER_HOUR: parseInt(process.env.AI_MAX_CALLS_PER_HOUR || "50", 10),
} as const;

export const VAULT_CONFIGS: Record<VaultStrategyType, VaultConfig> = {
  "safe-consensus": {
    id: parseInt(process.env.SAFE_VAULT_ID || "1", 10),
    name: "Safe Consensus",
    strategyType: "safe-consensus",
    minProbability: 0.85,
    maxProbability: 1.0,
    predictionAllocationPct: 0.62,
    lendAllocationPct: 0.33,
    maxPositionPct: 0.10,
    minVolume: 100_000,
    maxDaysToResolution: 30,
    categories: [],
  },
  "macro-contrarian": {
    id: parseInt(process.env.CONTRARIAN_VAULT_ID || "2", 10),
    name: "Macro Contrarian",
    strategyType: "macro-contrarian",
    minProbability: 0.40,
    maxProbability: 0.65,
    predictionAllocationPct: 0.78,
    lendAllocationPct: 0.15,
    maxPositionPct: 0.15,
    minVolume: 50_000,
    maxDaysToResolution: 90,
    categories: ["politics", "economics", "crypto"],
  },
  "yield-maximizer": {
    id: parseInt(process.env.YIELD_VAULT_ID || "3", 10),
    name: "Yield Maximizer",
    strategyType: "yield-maximizer",
    minProbability: 0.75,
    maxProbability: 1.0,
    predictionAllocationPct: 0.28,
    lendAllocationPct: 0.67,
    maxPositionPct: 0.08,
    minVolume: 200_000,
    maxDaysToResolution: 14,
    categories: [],
  },
};

export function getAllVaultConfigs(): VaultConfig[] {
  return Object.values(VAULT_CONFIGS);
}

export function getVaultConfig(type: VaultStrategyType): VaultConfig {
  return VAULT_CONFIGS[type];
}
