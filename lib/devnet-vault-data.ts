import type { Connection } from "@solana/web3.js";
import { getAccount, TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";

import { getReadonlyProgram } from "@/lib/spectra/program";
import {
  deriveAssetVaultPda,
  deriveVaultPda,
  getVaultState,
} from "@/lib/spectra/vault-client";
import type { VaultState as OnChainVault } from "@/lib/spectra/types";
import type { VaultId, VaultState as UiVaultState } from "@/types";

const USDC_DECIMALS = 6;
const SHARE_DECIMALS = 9;

/** Human PPS = (total assets USDC) / (total shares). */
export function ppsFromTotals(totalAssets: BN, totalShares: BN): number {
  if (totalShares.isZero()) return 1;
  const assets = Number(totalAssets.toString(10)) / 10 ** USDC_DECIMALS;
  const shares = Number(totalShares.toString(10)) / 10 ** SHARE_DECIMALS;
  if (shares <= 0) return 1;
  return assets / shares;
}

/**
 * High-water mark uses the same fixed-point scale as on-chain PPS in fee math
 * (`current_pps` ≈ `total_assets * 1e9 / total_shares`; display = value / 1e6).
 */
export function highWaterMarkHuman(highWaterMark: BN, ppsFallback: number): number {
  const raw = highWaterMark.toNumber();
  if (!Number.isFinite(raw) || raw <= 0) return ppsFallback;
  return raw / 1_000_000;
}

export function mapOnChainToUiVaultState(
  vaultId: VaultId,
  raw: OnChainVault,
  custodyLamports: BN
): UiVaultState {
  const nav = Number(raw.totalAssets.toString(10)) / 10 ** USDC_DECIMALS;
  const totalSharesHuman =
    Number(raw.totalShares.toString(10)) / 10 ** SHARE_DECIMALS;
  const custodyUsdc =
    Number(custodyLamports.toString(10)) / 10 ** USDC_DECIMALS;
  const pps = ppsFromTotals(raw.totalAssets, raw.totalShares);
  const hwm = highWaterMarkHuman(raw.highWaterMark, pps);

  return {
    vaultId,
    totalDeposits: nav,
    totalShares: totalSharesHuman,
    nav,
    pricePerShare: pps,
    activePredictions: 0,
    lendingDeployed: 0,
    idleUsdc: custodyUsdc,
    highWaterMark: hwm,
    performanceSinceInception: 0,
    last24hReturn: 0,
    last7dReturn: 0,
    last30dReturn: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchCustodyBalance(
  connection: Connection,
  vaultPda: import("@solana/web3.js").PublicKey
): Promise<BN> {
  const [assetVault] = deriveAssetVaultPda(vaultPda);
  try {
    const acc = await getAccount(
      connection,
      assetVault,
      "confirmed",
      SPL_TOKEN_PROGRAM_ID
    );
    return new BN(acc.amount.toString());
  } catch {
    return new BN(0);
  }
}

export type VaultChainSnapshot = {
  chainVaultId: number;
  onChain: OnChainVault;
  custodyLamports: BN;
};

export async function fetchVaultSnapshot(
  connection: Connection,
  chainVaultId: number
): Promise<VaultChainSnapshot | null> {
  const program = getReadonlyProgram(connection);
  try {
    const onChain = await getVaultState(program, chainVaultId);
    const [vaultPda] = deriveVaultPda(chainVaultId);
    const custodyLamports = await fetchCustodyBalance(connection, vaultPda);
    return { chainVaultId, onChain, custodyLamports };
  } catch {
    return null;
  }
}
