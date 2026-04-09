import type { VaultConfig } from "@/types";

export const SPL_TOKEN_PROGRAM_ID =
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as const;

export const TOKEN_2022_PROGRAM_ID =
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" as const;

export const ASSOCIATED_TOKEN_PROGRAM_ID =
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as const;

export const USDC_MINT_DEVNET =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" as const;

export const USDC_MINT_MAINNET =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as const;

export const USDC_DECIMALS = 6;

export const API_ENDPOINTS = {
  JUPITER_PREDICTION: "https://api.jup.ag/prediction/v1",
  JUPITER_LEND: "https://api.jup.ag/lend/v1",
  JUPITER_PRICE: "https://api.jup.ag/price/v2",
  JUPITER_TOKENS: "https://api.jup.ag/tokens/v1",
  JUPITER_TRIGGER: "https://api.jup.ag/trigger/v1",
  DUNE_SIM: "https://api.sim.dune.com/v1",
  ENGINE_HEALTH: "http://localhost:3001/health",
} as const;

export const PERFORMANCE_FEE_BPS = 1000; // 10% above high-water mark

export const VAULT_CONFIGS: VaultConfig[] = [
  {
    id: "safe-consensus",
    name: "Safe Consensus",
    ticker: "spSAFE",
    description:
      "Low-risk vault buying high-probability prediction markets (>85%). Ideal for conservative depositors seeking steady, predictable returns.",
    strategy:
      "Buys YES positions on events with >85% consensus probability. Auto-harvests resolved markets and reinvests.",
    riskLevel: "low",
    targetApy: { min: 8, max: 15 },
    icon: "🛡️",
    accentColor: "#00e5c3",
    allocation: { predictions: 60, lending: 30, idle: 10 },
    minDeposit: 10,
    performanceFeeBps: 1000,
  },
  {
    id: "macro-contrarian",
    name: "Macro Contrarian",
    ticker: "spMACRO",
    description:
      "Higher-risk vault targeting mispriced events in politics, economics, and geopolitics. For sophisticated depositors comfortable with volatility.",
    strategy:
      "Identifies mispriced 40-65% probability events using signal analysis. Takes contrarian positions with conviction-weighted sizing.",
    riskLevel: "high",
    targetApy: { min: 20, max: 50 },
    icon: "🎯",
    accentColor: "#f59e0b",
    allocation: { predictions: 80, lending: 10, idle: 10 },
    minDeposit: 50,
    performanceFeeBps: 1000,
  },
  {
    id: "yield-maximizer",
    name: "Yield Maximizer",
    ticker: "spYIELD",
    description:
      "Balanced vault splitting between Jupiter Lend yield and high-conviction predictions (>75%). Best of both worlds.",
    strategy:
      "70% deployed to Jupiter Lend for base yield, 30% allocated to >75% conviction prediction markets for alpha.",
    riskLevel: "medium",
    targetApy: { min: 12, max: 25 },
    icon: "💎",
    accentColor: "#8b5cf6",
    allocation: { predictions: 30, lending: 70, idle: 0 },
    minDeposit: 25,
    performanceFeeBps: 1000,
  },
];

export const MOCK_VAULT_STATES: Record<string, import("@/types").VaultState> = {
  "safe-consensus": {
    vaultId: "safe-consensus",
    totalDeposits: 245_000,
    totalShares: 240_196,
    nav: 252_400,
    pricePerShare: 1.051,
    activePredictions: 12,
    lendingDeployed: 73_500,
    idleUsdc: 24_500,
    highWaterMark: 1.051,
    performanceSinceInception: 5.1,
    last24hReturn: 0.08,
    last7dReturn: 0.52,
    last30dReturn: 2.1,
    sharpeRatio: 2.4,
    maxDrawdown: -1.2,
    updatedAt: new Date().toISOString(),
  },
  "macro-contrarian": {
    vaultId: "macro-contrarian",
    totalDeposits: 89_000,
    totalShares: 82_407,
    nav: 98_200,
    pricePerShare: 1.192,
    activePredictions: 8,
    lendingDeployed: 8_900,
    idleUsdc: 8_900,
    highWaterMark: 1.192,
    performanceSinceInception: 19.2,
    last24hReturn: 0.34,
    last7dReturn: 1.87,
    last30dReturn: 7.4,
    sharpeRatio: 1.6,
    maxDrawdown: -8.5,
    updatedAt: new Date().toISOString(),
  },
  "yield-maximizer": {
    vaultId: "yield-maximizer",
    totalDeposits: 178_000,
    totalShares: 170_673,
    nav: 191_200,
    pricePerShare: 1.12,
    activePredictions: 6,
    lendingDeployed: 124_600,
    idleUsdc: 0,
    highWaterMark: 1.12,
    performanceSinceInception: 12.0,
    last24hReturn: 0.15,
    last7dReturn: 0.94,
    last30dReturn: 3.8,
    sharpeRatio: 2.1,
    maxDrawdown: -3.1,
    updatedAt: new Date().toISOString(),
  },
};

export function getVaultConfig(id: string): VaultConfig | undefined {
  return VAULT_CONFIGS.find((v) => v.id === id);
}
