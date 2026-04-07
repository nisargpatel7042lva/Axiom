import type { Decimal } from "decimal.js";

export type VaultId = "safe-consensus" | "macro-contrarian" | "yield-maximizer";

export type RiskLevel = "low" | "medium" | "high";

export interface VaultConfig {
  id: VaultId;
  name: string;
  ticker: string;
  description: string;
  strategy: string;
  riskLevel: RiskLevel;
  targetApy: { min: number; max: number };
  icon: string;
  accentColor: string;
  allocation: AllocationBreakdown;
  minDeposit: number;
  performanceFeeBps: number;
}

export interface AllocationBreakdown {
  predictions: number;
  lending: number;
  idle: number;
}

export interface VaultState {
  vaultId: VaultId;
  totalDeposits: number;
  totalShares: number;
  nav: number;
  pricePerShare: number;
  activePredictions: number;
  lendingDeployed: number;
  idleUsdc: number;
  highWaterMark: number;
  performanceSinceInception: number;
  last24hReturn: number;
  last7dReturn: number;
  last30dReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  updatedAt: string;
}

export interface UserVaultPosition {
  vaultId: VaultId;
  shares: number;
  depositedUsdc: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  depositedAt: string;
}

export interface PredictionMarket {
  id: string;
  title: string;
  category: string;
  probability: number;
  volume: number;
  endDate: string;
  source: string;
}

export interface PredictionPosition {
  marketId: string;
  marketTitle: string;
  side: "yes" | "no";
  shares: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface NavBreakdown {
  predictionPositions: number;
  lendingBalance: number;
  accruedYield: number;
  idleUsdc: number;
  totalNav: number;
  pricePerShare: number;
  totalShares: number;
}

export interface PerformanceDataPoint {
  timestamp: string;
  nav: number;
  pricePerShare: number;
  benchmark: number;
}

export interface VaultActivity {
  id: string;
  type: "deposit" | "withdraw" | "prediction_buy" | "prediction_sell" | "lend_deposit" | "lend_withdraw" | "fee_collection";
  amount: number;
  description: string;
  timestamp: string;
  txSignature?: string;
}

export interface DepositParams {
  vaultId: VaultId;
  amountUsdc: number;
}

export interface WithdrawParams {
  vaultId: VaultId;
  shares: number;
}

export type ChainId = "solana";
