import path from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

import type { VaultConfig, VaultStrategyType } from "./types/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const engineRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(engineRoot, "..");

/**
 * Vault authority keypair: same vars as Anchor / README.
 * Relative paths resolve against the **repo root** (so `./keypair.json` in
 * `.env.local` works whether you start the engine from `engine/` or the repo).
 */
function resolveKeypairPath(): string {
  const raw =
    process.env.VAULT_AUTHORITY_KEYPAIR_PATH?.trim() ||
    process.env.ANCHOR_WALLET?.trim();
  if (!raw) {
    return path.join(homedir(), ".config", "solana", "id.json");
  }
  if (raw.startsWith("~/")) {
    return path.join(homedir(), raw.slice(2));
  }
  if (raw.startsWith("./") || raw.startsWith("../")) {
    return path.resolve(repoRoot, raw);
  }
  return path.resolve(raw);
}

function envNum(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const CONFIG = {
  RPC_URL: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  KEYPAIR_PATH: resolveKeypairPath(),

  JUPITER_API_KEY:
    process.env.JUPITER_API_KEY ||
    process.env.NEXT_PUBLIC_JUPITER_API_KEY ||
    process.env.JUPITER_PREDICTION_API_KEY ||
    "",

  JUPITER_PREDICTION_BASE: "https://api.jup.ag/prediction/v1",
  /** Price v2 is deprecated (404); v3 uses `usdPrice` per mint key. */
  JUPITER_PRICE_BASE: "https://api.jup.ag/price/v3",
  JUPITER_TOKENS_BASE: "https://api.jup.ag/tokens/v2",
  JUPITER_TRIGGER_BASE: "https://api.jup.ag/trigger/v1",

  VAULT_PROGRAM_ID:
    process.env.VAULT_PROGRAM_ID || "JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH",
  USDC_MINT:
    process.env.USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",

  HEALTH_PORT: parseInt(process.env.HEALTH_PORT || "3001", 10),

  VAULT_NAV_SNAPSHOT_DIR: process.env.VAULT_NAV_SNAPSHOT_DIR?.trim() || "",
  ENABLE_TOKENS_ENRICHMENT:
    process.env.ENABLE_TOKENS_ENRICHMENT?.toLowerCase() === "true",

  IDLE_BUFFER_PCT: 0.05,

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
    // Slightly broader defaults for dev/demo so opportunities appear more often.
    minProbability: envNum("SAFE_MIN_PROBABILITY", 0.75),
    maxProbability: envNum("SAFE_MAX_PROBABILITY", 1.0),
    predictionAllocationPct: 0.62,
    lendAllocationPct: 0.33,
    maxPositionPct: 0.1,
    minVolume: envNum("SAFE_MIN_VOLUME", 30_000),
    maxDaysToResolution: envNum("SAFE_MAX_DAYS_TO_RESOLUTION", 45),
    categories: [],
  },
  "macro-contrarian": {
    id: parseInt(process.env.CONTRARIAN_VAULT_ID || "2", 10),
    name: "Macro Contrarian",
    strategyType: "macro-contrarian",
    minProbability: envNum("CONTRARIAN_MIN_PROBABILITY", 0.3),
    maxProbability: envNum("CONTRARIAN_MAX_PROBABILITY", 0.75),
    predictionAllocationPct: 0.78,
    lendAllocationPct: 0.15,
    maxPositionPct: 0.15,
    minVolume: envNum("CONTRARIAN_MIN_VOLUME", 20_000),
    maxDaysToResolution: envNum("CONTRARIAN_MAX_DAYS_TO_RESOLUTION", 120),
    categories: ["politics", "economics", "crypto"],
  },
  "yield-maximizer": {
    id: parseInt(process.env.YIELD_VAULT_ID || "3", 10),
    name: "Yield Maximizer",
    strategyType: "yield-maximizer",
    minProbability: envNum("YIELD_MIN_PROBABILITY", 0.65),
    maxProbability: envNum("YIELD_MAX_PROBABILITY", 1.0),
    predictionAllocationPct: 0.28,
    lendAllocationPct: 0.67,
    maxPositionPct: 0.08,
    minVolume: envNum("YIELD_MIN_VOLUME", 40_000),
    maxDaysToResolution: envNum("YIELD_MAX_DAYS_TO_RESOLUTION", 30),
    categories: [],
  },
};

export function getAllVaultConfigs(): VaultConfig[] {
  return Object.values(VAULT_CONFIGS);
}

export function getVaultConfig(type: VaultStrategyType): VaultConfig {
  return VAULT_CONFIGS[type];
}
