import type { PublicKey, TransactionSignature } from "@solana/web3.js";

// ---------------------------------------------------------------------------
// Jupiter Prediction API types
// ---------------------------------------------------------------------------

export interface PredictionEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  provider: "polymarket" | "kalshi" | string;
  status: "active" | "resolved" | "cancelled";
  endDate: string;
  markets: PredictionMarket[];
}

export interface PredictionMarket {
  id: string;
  eventId: string;
  title: string;
  buyYesPriceUsd: number;
  buyNoPriceUsd: number;
  volume24h: number;
  volumeTotal: number;
  liquidity: number;
  status: "active" | "resolved" | "cancelled";
  resolution: "yes" | "no" | null;
}

export interface PredictionPosition {
  marketId: string;
  ownerPubkey: string;
  isYes: boolean;
  contracts: string;
  avgEntryPrice: number;
  currentPrice: number;
  pnlUsd: number;
  market: Pick<PredictionMarket, "id" | "title" | "status" | "resolution">;
}

export interface OrderParams {
  ownerPubkey: string;
  marketId: string;
  isYes: boolean;
  isBuy: boolean;
  depositAmount: string;
  depositMint: string;
}

export interface OrderResponse {
  transaction: string;
}

// ---------------------------------------------------------------------------
// Strategy / scoring types
// ---------------------------------------------------------------------------

export type VaultStrategyType = "safe-consensus" | "macro-contrarian" | "yield-maximizer";

export interface VaultConfig {
  id: number;
  name: string;
  strategyType: VaultStrategyType;
  minProbability: number;
  maxProbability: number;
  predictionAllocationPct: number;
  lendAllocationPct: number;
  maxPositionPct: number;
  minVolume: number;
  maxDaysToResolution: number;
  categories: string[];
}

export type AiScoreSource = "llm" | "rules_fallback";

/** AI / rules layer output attached after PROMPT 5 scoring. */
export interface ScoredOpportunityAiMeta {
  marketId: string;
  conviction: number;
  mispricing_signal: number;
  resolution_clarity: number;
  reasoning: string;
  recommended_side: "YES" | "NO" | "SKIP";
  risk_flags: string[];
  source: AiScoreSource;
}

export interface ScoredOpportunity {
  eventId: string;
  marketId: string;
  title: string;
  category: string;
  probability: number;
  volume: number;
  volumeTotal: number;
  side: "yes" | "no";
  price: number;
  expectedValue: number;
  score: number;
  daysToResolution: number;
  vaultFit: VaultStrategyType[];
  /** Populated when AI scoring (or rules fallback) runs in market-scanner. */
  ai?: ScoredOpportunityAiMeta;
}

// ---------------------------------------------------------------------------
// NAV types
// ---------------------------------------------------------------------------

export interface NavBreakdown {
  vaultId: string;
  predictionPositionsValue: number;
  lendingBalance: number;
  idleUsdc: number;
  totalNav: number;
  pricePerShare: number;
  totalShares: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Vault on-chain state (mirrors Anchor account)
// ---------------------------------------------------------------------------

export interface VaultState {
  authority: PublicKey;
  assetMint: PublicKey;
  sharesMint: PublicKey;
  assetVault: PublicKey;
  totalAssets: bigint;
  totalShares: bigint;
  vaultId: bigint;
  strategyType: number;
  highWaterMark: bigint;
  performanceFeeBps: number;
  isPaused: boolean;
  bump: number;
}

export interface StrategyConfig {
  vault: PublicKey;
  minProbability: number;
  maxProbability: number;
  maxPositionPct: number;
  lendAllocationPct: number;
  categories: string[];
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Engine internal state
// ---------------------------------------------------------------------------

export interface ActivePosition {
  vaultId: string;
  marketId: string;
  eventId: string;
  title: string;
  side: "yes" | "no";
  contracts: number;
  avgEntryPrice: number;
  currentPrice: number;
  usdcDeployed: number;
  pnlUsd: number;
  openedAt: string;
}

export interface LendingPosition {
  vaultId: string;
  depositedUsdc: number;
  currentBalance: number;
  apy: number;
  lastUpdated: string;
}

export interface EngineHealth {
  status: "ok" | "degraded" | "error";
  uptime: number;
  lastScan: string | null;
  lastNavSync: string | null;
  lastPositionCheck: string | null;
  lastYieldRoute: string | null;
  vaultCount: number;
  totalPositions: number;
}

export interface TradeLog {
  timestamp: string;
  vaultId: string;
  action: "open" | "close" | "harvest";
  marketId: string;
  side: "yes" | "no";
  amount: number;
  price: number;
  txSignature: string | null;
}
