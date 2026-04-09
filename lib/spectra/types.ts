import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

/** On-chain VaultState account — mirrors `state::VaultState` in the Anchor program. */
export interface VaultState {
  authority: PublicKey;
  assetMint: PublicKey;
  sharesMint: PublicKey;
  assetVault: PublicKey;
  totalAssets: BN;
  totalShares: BN;
  vaultId: BN;
  strategyType: number;
  highWaterMark: BN;
  performanceFeeBps: number;
  isPaused: boolean;
  bump: number;
}

/** On-chain StrategyConfig account — mirrors `state::StrategyConfig`. */
export interface StrategyConfig {
  vault: PublicKey;
  minProbability: number;
  maxProbability: number;
  maxPositionPct: number;
  lendAllocationPct: number;
  categories: string[];
  isActive: boolean;
  bump: number;
}

/** Frontend-only aggregate of a user's position in a single vault. */
export interface UserVaultPosition {
  vaultId: number;
  vaultName: string;
  sharesHeld: BN;
  currentValue: number;
  pnl: number;
  depositedAmount: number;
}

/** Result of a deposit preview calculation. */
export interface DepositPreview {
  sharesToReceive: BN;
  estimatedPPS: number;
}

/** Result of a withdrawal preview calculation. */
export interface WithdrawPreview {
  usdcToReceive: BN;
  estimatedPPS: number;
}

/** Vault metadata used in the catalog UI. */
export interface VaultMeta {
  id: number;
  name: string;
  description: string;
  riskLevel: "Low" | "Medium" | "High";
  strategyType: number;
}

/** Strategy type enum mirroring the on-chain u8 representation. */
export const StrategyType = {
  SafeConsensus: 0,
  MacroContrarian: 1,
  YieldMaximizer: 2,
} as const;

export type StrategyTypeName = keyof typeof StrategyType;
