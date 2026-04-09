import { jupiterPrediction } from "../services/jupiter-prediction.js";
import { jupiterPrice } from "../services/jupiter-price.js";
import { jupiterLend } from "../services/jupiter-lend.js";
import { getAuthority, getTokenBalance } from "../services/solana.js";
import {
  syncNav as syncNavOnChain,
  deriveVaultPda,
  getTotalShares,
} from "../services/vault-contract.js";
import { getActivePositions } from "./position-manager.js";
import { getLendingState } from "./yield-router.js";
import { getAllVaultConfigs, CONFIG } from "../config.js";
import { createLogger } from "../utils/logger.js";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { NavBreakdown } from "../types/index.js";

const log = createLogger("nav-calculator");

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

      // Push NAV on-chain
      await syncNavOnChain(vaultConfig.id, nav.totalNav);
    } catch (err) {
      log.error(`[${vaultConfig.name}] NAV computation failed`, err);
    }
  }

  log.info("NAV sync complete");
}

async function computeVaultNav(vaultId: string, onChainVaultId: number): Promise<NavBreakdown> {
  // 0. Validate USDC price via Jupiter Price API (sanity check)
  const usdcPrice = await jupiterPrice.getUsdcPrice();
  log.debug(`USDC price validation: $${usdcPrice.toFixed(4)}`);

  // 1. Value active prediction positions at current market prices
  const predictionPositionsValue = await valuePredictionPositions(vaultId);

  // 2. Jupiter Lend balance
  const lendingState = getLendingState(vaultId);
  const lendingBalance = lendingState?.currentBalance ?? (await jupiterLend.getEarnBalance());

  // 3. Idle USDC in vault token account
  const idleUsdc = await getIdleUsdcBalance(onChainVaultId);

  // Apply USDC price correction (should be ~1.0 but protects against depegs)
  const totalNav = (predictionPositionsValue + lendingBalance + idleUsdc) * usdcPrice;

  // 4. Get total shares for PPS calculation
  const totalShares = await getTotalShares(onChainVaultId);
  const pricePerShare = totalShares > 0 ? totalNav / totalShares : 1.0;

  return {
    vaultId,
    predictionPositionsValue,
    lendingBalance,
    idleUsdc,
    totalNav,
    pricePerShare,
    totalShares,
    timestamp: new Date().toISOString(),
  };
}

async function valuePredictionPositions(vaultId: string): Promise<number> {
  const positions = getActivePositions(vaultId);
  if (positions.length === 0) return 0;

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
  } catch {
    for (const pos of positions) {
      totalValue += pos.contracts * pos.currentPrice;
    }
  }

  return totalValue;
}

async function getIdleUsdcBalance(vaultId: number): Promise<number> {
  try {
    const [vaultPda] = deriveVaultPda(vaultId);
    const usdcMint = new PublicKey(CONFIG.USDC_MINT);
    const ata = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);
    return await getTokenBalance(ata);
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
