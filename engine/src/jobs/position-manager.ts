import { PublicKey } from "@solana/web3.js";
import { jupiterPrediction } from "../services/jupiter-prediction.js";
import { jupiterTrigger } from "../services/jupiter-trigger.js";
import { jupiterLend } from "../services/jupiter-lend.js";
import { getAuthority, signAndSend, getTokenBalance } from "../services/solana.js";
import { deriveVaultPda, deriveAssetVaultPda } from "../services/vault-contract.js";
import { getOpportunities, getStrategy } from "./market-scanner.js";
import { getNav } from "./nav-calculator.js";
import { getAllVaultConfigs, CONFIG } from "../config.js";
import { createLogger } from "../utils/logger.js";
import type {
  ActivePosition,
  PredictionPosition,
  ScoredOpportunity,
  TradeLog,
  VaultStrategyType,
} from "../types/index.js";

const log = createLogger("position-manager");

/** In-memory ledger of positions managed by the engine. */
const activePositions = new Map<string, ActivePosition[]>();
const tradeHistory: TradeLog[] = [];

export async function runPositionManager(): Promise<void> {
  log.info("Running position check...");
  const authority = getAuthority();
  const ownerPubkey = authority.publicKey.toBase58();

  let onChainPositions: PredictionPosition[] = [];
  try {
    onChainPositions = await jupiterPrediction.getPositions(ownerPubkey);
  } catch (err) {
    log.error("Failed to fetch positions from Jupiter", err);
  }

  for (const vaultConfig of getAllVaultConfigs()) {
    const vaultId = vaultConfig.strategyType;
    const strategy = getStrategy(vaultId);
    const positions = activePositions.get(vaultId) ?? [];

    // 1. Check for resolved markets → harvest winnings
    for (const pos of [...positions]) {
      const onChain = onChainPositions.find((p) => p.marketId === pos.marketId);

      if (onChain?.market.status === "resolved") {
        log.info(`Market resolved: ${pos.title} (${pos.marketId})`);
        removePosition(vaultId, pos.marketId);
        logTrade(vaultId, "harvest", pos);
        continue;
      }

      // 2. Check if strategy says we should exit
      if (onChain) {
        const currentPrice = onChain.currentPrice;
        const marketData = { buyYesPriceUsd: currentPrice } as any;
        if (strategy.shouldExit(currentPrice, pos.avgEntryPrice, marketData)) {
          log.info(`Exit signal for ${pos.title} (entry: ${pos.avgEntryPrice}, current: ${currentPrice})`);
          await closePosition(ownerPubkey, pos);
          removePosition(vaultId, pos.marketId);
          logTrade(vaultId, "close", pos);
        }
      }
    }

    // 3. Look for new opportunities from the scanner
    const opportunities = getOpportunities(vaultId);
    const currentPositionMarkets = new Set((activePositions.get(vaultId) ?? []).map((p) => p.marketId));
    const newOpps = opportunities.filter((o) => !currentPositionMarkets.has(o.marketId));

    if (newOpps.length === 0) {
      log.info(`[${vaultConfig.name}] No new opportunities`);
      continue;
    }

    // 4. Check pending trigger (limit) orders
    try {
      const triggerOrders = await jupiterTrigger.getOrders(ownerPubkey);
      const filledOrders = triggerOrders.filter((o) => o.status === "filled");
      if (filledOrders.length > 0) {
        log.info(`[${vaultConfig.name}] ${filledOrders.length} trigger orders filled`);
      }
    } catch (err) {
      log.debug("Trigger order check failed (non-fatal)", err);
    }

    // 5. Open positions for top opportunities (up to 3 per cycle)
    const maxNewPositions = 3;
    for (const opp of newOpps.slice(0, maxNewPositions)) {
      const positionSizeUsdc = strategy.calculatePositionSize(getEstimatedNav(vaultId));

      if (positionSizeUsdc < 10) {
        log.info(`[${vaultConfig.name}] Position size too small ($${positionSizeUsdc.toFixed(2)}), skipping`);
        continue;
      }

      // Use limit order via Trigger API if price is above our target
      // (try to get a better entry), otherwise use market order
      const USE_LIMIT_ORDERS = opp.price > 0.70 && opp.price < 0.95;

      await ensureVaultLiquidity(vaultConfig.id, positionSizeUsdc);

      if (USE_LIMIT_ORDERS) {
        const targetPrice = opp.price * 0.97; // try to enter 3% below current
        log.info(
          `[${vaultConfig.name}] Setting limit entry on "${opp.title}" @ $${targetPrice.toFixed(3)} — $${positionSizeUsdc.toFixed(2)}`,
        );
        await openLimitPosition(ownerPubkey, vaultId, opp, positionSizeUsdc, targetPrice);
      } else {
        log.info(
          `[${vaultConfig.name}] Market-ordering ${opp.side} on "${opp.title}" — $${positionSizeUsdc.toFixed(2)}`,
        );
        await openPosition(ownerPubkey, vaultId, opp, positionSizeUsdc);
      }
    }

    const updatedPositions = activePositions.get(vaultId) ?? [];
    log.info(`[${vaultConfig.name}] ${updatedPositions.length} active positions`);
  }

  log.info("Position check complete");
}

async function openPosition(
  ownerPubkey: string,
  vaultId: VaultStrategyType,
  opp: ScoredOpportunity,
  usdcAmount: number,
): Promise<void> {
  try {
    const result = (await jupiterPrediction.createOrder({
      ownerPubkey,
      marketId: opp.marketId,
      isYes: opp.side === "yes",
      isBuy: true,
      depositAmount: (usdcAmount * 1e6).toString(),
      depositMint: CONFIG.USDC_MINT,
    })) as { transaction?: string };

    const sig = await signAndSend(result.transaction ?? "");

    const pos: ActivePosition = {
      vaultId,
      marketId: opp.marketId,
      eventId: opp.eventId,
      title: opp.title,
      side: opp.side,
      contracts: usdcAmount / opp.price,
      avgEntryPrice: opp.price,
      currentPrice: opp.price,
      usdcDeployed: usdcAmount,
      pnlUsd: 0,
      openedAt: new Date().toISOString(),
    };

    const positions = activePositions.get(vaultId) ?? [];
    positions.push(pos);
    activePositions.set(vaultId, positions);

    logTrade(vaultId, "open", pos, sig);
    log.info(`Opened position on ${opp.title}: ${sig}`);
  } catch (err) {
    log.error(`Failed to open position on ${opp.title}`, err);
  }
}

async function openLimitPosition(
  ownerPubkey: string,
  vaultId: VaultStrategyType,
  opp: ScoredOpportunity,
  usdcAmount: number,
  targetPrice: number,
): Promise<void> {
  try {
    const result = await jupiterTrigger.createLimitEntry({
      ownerPubkey,
      usdcMint: CONFIG.USDC_MINT,
      predictionTokenMint: opp.marketId,
      usdcAmount,
      targetPrice,
      expiresInHours: 24,
    });

    await signAndSend(result.transaction);
    log.info(`Limit order placed for "${opp.title}" @ $${targetPrice.toFixed(3)} (order: ${result.orderId})`);
  } catch (err) {
    log.error(`Failed to create limit entry for ${opp.title}, falling back to market order`, err);
    await openPosition(ownerPubkey, vaultId, opp, usdcAmount);
  }
}

async function closePosition(
  ownerPubkey: string,
  pos: ActivePosition,
): Promise<void> {
  try {
    const result = (await jupiterPrediction.sellPosition({
      ownerPubkey,
      marketId: pos.marketId,
      isYes: pos.side === "yes",
      contracts: pos.contracts.toString(),
    })) as { transaction?: string };
    await signAndSend(result.transaction ?? "");
  } catch (err) {
    log.error(`Failed to close position on ${pos.title}`, err);
  }
}

function removePosition(vaultId: string, marketId: string): void {
  const positions = activePositions.get(vaultId) ?? [];
  activePositions.set(
    vaultId,
    positions.filter((p) => p.marketId !== marketId),
  );
}

function logTrade(
  vaultId: string,
  action: TradeLog["action"],
  pos: ActivePosition,
  txSignature: string | null = null,
): void {
  tradeHistory.push({
    timestamp: new Date().toISOString(),
    vaultId,
    action,
    marketId: pos.marketId,
    side: pos.side,
    amount: pos.usdcDeployed,
    price: pos.currentPrice,
    txSignature,
  });
}

function getEstimatedNav(vaultId: string): number {
  const nav = getNav(vaultId);
  if (nav && nav.totalNav > 0) return nav.totalNav;
  return 100_000;
}

/** PROMPT: withdraw USDC from Jupiter Lend if vault idle balance is insufficient to open. */
async function ensureVaultLiquidity(onChainVaultId: number, neededUsdc: number): Promise<void> {
  const idle = await readVaultIdleUsdc(onChainVaultId);
  const shortfall = neededUsdc - idle;
  if (shortfall <= 1) return;

  log.info(
    `Idle USDC $${idle.toFixed(2)} < needed $${neededUsdc.toFixed(2)} — withdrawing $${shortfall.toFixed(2)} from Jupiter Lend`,
  );
  try {
    await jupiterLend.sendWithdrawFromEarn(shortfall);
  } catch (err) {
    log.error("withdrawFromEarn for position open failed", err);
  }
}

async function readVaultIdleUsdc(onChainVaultId: number): Promise<number> {
  try {
    const [vaultPda] = deriveVaultPda(onChainVaultId);
    const [assetVault] = deriveAssetVaultPda(vaultPda);
    return await getTokenBalance(assetVault);
  } catch {
    return 0;
  }
}

export function getActivePositions(vaultId: string): ActivePosition[] {
  return activePositions.get(vaultId) ?? [];
}

export function getTradeHistory(): TradeLog[] {
  return tradeHistory;
}
