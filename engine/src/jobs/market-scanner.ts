import { jupiterPrediction } from "../services/jupiter-prediction.js";
import { jupiterTokens } from "../services/jupiter-tokens.js";
import { getAllVaultConfigs } from "../config.js";
import { SafeConsensusStrategy } from "../strategies/safe-consensus.js";
import { MacroContrarianStrategy } from "../strategies/macro-contrarian.js";
import { YieldMaximizerStrategy } from "../strategies/yield-maximizer.js";
import { createLogger } from "../utils/logger.js";
import type { BaseStrategy } from "../strategies/base-strategy.js";
import type { ScoredOpportunity, VaultStrategyType } from "../types/index.js";

const log = createLogger("market-scanner");

const strategies: Record<VaultStrategyType, BaseStrategy> = {
  "safe-consensus": new SafeConsensusStrategy(),
  "macro-contrarian": new MacroContrarianStrategy(),
  "yield-maximizer": new YieldMaximizerStrategy(),
};

/**
 * In-memory store of the most recent scan results per vault strategy.
 * Position manager reads from this to decide what to open.
 */
const latestOpportunities = new Map<VaultStrategyType, ScoredOpportunity[]>();

export async function runMarketScanner(): Promise<void> {
  log.info("Starting market scan...");

  let events;
  try {
    events = await jupiterPrediction.getActiveEvents();
  } catch (err) {
    log.error("Failed to fetch events", err);
    return;
  }

  log.info(`Fetched ${events.length} active events`);

  // Enrich events with token metadata from Jupiter Tokens API
  try {
    const marketIds = events.flatMap((e) => e.markets?.map((m) => m.id) ?? []);
    if (marketIds.length > 0) {
      const tokenMeta = await jupiterTokens.getTokens(marketIds.slice(0, 50));
      log.info(`Enriched ${tokenMeta.size} markets with Jupiter token metadata`);
    }
  } catch (err) {
    log.warn("Token metadata enrichment failed (non-fatal)", err);
  }

  for (const vaultConfig of getAllVaultConfigs()) {
    const strategy = strategies[vaultConfig.strategyType];
    const opportunities = strategy.scoreEvents(events);

    const top = opportunities.slice(0, 20);
    latestOpportunities.set(vaultConfig.strategyType, top);

    log.info(
      `[${vaultConfig.name}] ${top.length} opportunities (top score: ${top[0]?.score.toFixed(3) ?? "n/a"})`,
    );

    if (top.length > 0) {
      for (const opp of top.slice(0, 3)) {
        log.info(
          `  - ${opp.title} | ${opp.side.toUpperCase()} @ $${opp.price.toFixed(2)} | score ${opp.score.toFixed(3)}`,
        );
      }
    }
  }

  log.info("Market scan complete");
}

export function getOpportunities(strategyType: VaultStrategyType): ScoredOpportunity[] {
  return latestOpportunities.get(strategyType) ?? [];
}

export function getStrategy(strategyType: VaultStrategyType): BaseStrategy {
  return strategies[strategyType];
}
