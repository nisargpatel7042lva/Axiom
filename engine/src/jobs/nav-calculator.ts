import { jupiterPrediction } from "../services/jupiter-prediction.js";
import { jupiterPrice } from "../services/jupiter-price.js";
import { jupiterLend } from "../services/jupiter-lend.js";
import { getAuthority, getTokenBalance } from "../services/solana.js";
import {
  syncNav as syncNavOnChain,
  deriveVaultPda,
  deriveAssetVaultPda,
  getTotalShares,
} from "../services/vault-contract.js";
import { getActivePositions } from "./position-manager.js";
import { getLendingState } from "./yield-router.js";
import { appendVaultNavSnapshot } from "../data/vault-nav-snapshots.js";
import { getAllVaultConfigs } from "../config.js";
import { createLogger } from "../utils/logger.js";
import type { NavBreakdown } from "../types/index.js";

const log = createLogger("nav-calculator");

// Track previous PPS per vault to compute reputation score from performance
const prevPps = new Map<string, number>();

async function updateAgentReputation(vaultId: string, pps: number): Promise<void> {
  const apiBase = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const prev = prevPps.get(vaultId);
  prevPps.set(vaultId, pps);
  if (prev === undefined) return; // skip first cycle — no delta yet

  // Convert PPS delta → 0-100 performance score
  // +0.5% → 80, flat → 50, -0.5% → 20
  const pctChange = ((pps - prev) / prev) * 100;
  const score = Math.max(0, Math.min(100, 50 + pctChange * 60));

  try {
    await fetch(`${apiBase}/api/agents/${vaultId}/reputation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ performanceScore: score }),
    });
  } catch {
    // Non-critical — reputation update is best-effort
  }
}

const latestNav = new Map<string, NavBreakdown>();

export async function runNavCalculator(): Promise<void> {
  log.info("Computing NAV for all vaults...");

  for (const vaultConfig of getAllVaultConfigs()) {
    const vaultId = vaultConfig.strategyType;

    try {
      const nav = await computeVaultNav(vaultId, vaultConfig.id);
      latestNav.set(vaultId, nav);

      log.info(
        `[${vaultConfig.name}] NAV = $${nav.totalNav.toFixed(2)} | PPS = $${nav.pricePerShare.toFixed(6)} | ` +
          `Predictions: $${nav.predictionPositionsValue.toFixed(2)} | Lend: $${nav.lendingBalance.toFixed(2)} | ` +
          `Idle: $${nav.idleUsdc.toFixed(2)}`,
      );

      // Keep on-chain total_assets redeemable to avoid withdraw failures when
      // off-chain positions/lend value is temporarily illiquid on devnet demos.
      const redeemableNav = Math.max(0, nav.idleUsdc);
      await syncNavOnChain(vaultConfig.id, redeemableNav);
      nav.syncedNav = redeemableNav;
      nav.navDelta = nav.totalNav - redeemableNav;
      if (Math.abs(nav.navDelta) > 0.01 && !nav.degradedCauses.includes("liquidity_sync_delta")) {
        nav.degradedCauses.push("liquidity_sync_delta");
      }
      nav.dataQuality = nav.degradedCauses.length > 0 ? "degraded" : "verified";
      if (Math.abs(redeemableNav - nav.totalNav) > 0.01) {
        log.info(
          `[${vaultConfig.name}] Synced redeemable NAV $${redeemableNav.toFixed(2)} (computed total $${nav.totalNav.toFixed(2)})`,
        );
      }

      try {
        await appendVaultNavSnapshot({
          vaultId: vaultConfig.id,
          timestamp: nav.timestamp,
          totalNav: nav.totalNav,
          pps: nav.pricePerShare,
          predictionsValue: nav.predictionPositionsValue,
          lendValue: nav.lendingBalance,
          idleValue: nav.idleUsdc,
          feesAccrued: 0,
        });
      } catch (snapErr) {
        log.error(`[${vaultConfig.name}] NAV snapshot append failed`, snapErr);
      }

      // Update agent reputation based on PPS performance (best-effort)
      void updateAgentReputation(vaultId, nav.pricePerShare);
    } catch (err) {
      const detail =
        err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
      log.error(`[${vaultConfig.name}] NAV computation failed`, detail);
    }
  }

  log.info("NAV sync complete");
}

async function computeVaultNav(vaultId: string, onChainVaultId: number): Promise<NavBreakdown> {
  const usdcPrice = await jupiterPrice.getUsdcPrice();
  log.debug(`USDC price validation: $${usdcPrice.toFixed(4)}`);

  const prediction = await valuePredictionPositions(vaultId);

  const lendingState = getLendingState(vaultId);
  const lendingBalance = lendingState?.currentBalance ?? (await jupiterLend.getEarnBalance());
  const lendingValuationSource: NavBreakdown["lendingValuationSource"] =
    lendingState?.currentBalance != null ? "state_cache" : "api";

  const idleUsdc = await getIdleUsdcBalance(onChainVaultId);

  const totalNav = (prediction.value + lendingBalance + idleUsdc) * usdcPrice;

  const totalShares = await getTotalShares(onChainVaultId);
  const pricePerShare = totalShares > 0 ? totalNav / totalShares : 1.0;

  return {
    vaultId,
    predictionPositionsValue: prediction.value,
    predictionValuationSource: prediction.source,
    lendingBalance,
    lendingValuationSource,
    idleUsdc,
    totalNav,
    syncedNav: totalNav,
    navDelta: 0,
    dataQuality: prediction.source === "fallback" ? "degraded" : "verified",
    degradedCauses:
      prediction.source === "fallback" ? ["prediction_api_fallback"] : [],
    pricePerShare,
    totalShares,
    timestamp: new Date().toISOString(),
  };
}

async function valuePredictionPositions(
  vaultId: string,
): Promise<{ value: number; source: "live" | "fallback" }> {
  const positions = getActivePositions(vaultId);
  if (positions.length === 0) return { value: 0, source: "live" };

  let totalValue = 0;
  const ownerPubkey = getAuthority().publicKey.toBase58();

  try {
    const onChainPositions = await jupiterPrediction.getPositions(ownerPubkey);
    const positionMap = new Map(onChainPositions.map((p) => [p.marketId, p]));

    for (const pos of positions) {
      const onChain = positionMap.get(pos.marketId);
      if (onChain) {
        totalValue += parseFloat(onChain.contracts) * onChain.currentPrice;
      } else {
        totalValue += pos.contracts * pos.currentPrice;
      }
    }
    return { value: totalValue, source: "live" };
  } catch {
    for (const pos of positions) {
      totalValue += pos.contracts * pos.currentPrice;
    }
    return { value: totalValue, source: "fallback" };
  }
}

async function getIdleUsdcBalance(vaultId: number): Promise<number> {
  try {
    const [vaultPda] = deriveVaultPda(vaultId);
    const [assetVault] = deriveAssetVaultPda(vaultPda);
    return await getTokenBalance(assetVault);
  } catch {
    return 0;
  }
}

export function getNav(vaultId: string): NavBreakdown | undefined {
  return latestNav.get(vaultId);
}

export function getAllNavs(): NavBreakdown[] {
  return Array.from(latestNav.values());
}
