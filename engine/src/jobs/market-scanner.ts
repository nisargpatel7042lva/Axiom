import fs from "node:fs/promises";
import path from "node:path";
import { jupiterPrediction } from "../services/jupiter-prediction.js";
import { jupiterTokens } from "../services/jupiter-tokens.js";
import { getAllVaultConfigs, CONFIG } from "../config.js";
import { SafeConsensusStrategy } from "../strategies/safe-consensus.js";
import { MacroContrarianStrategy } from "../strategies/macro-contrarian.js";
import { YieldMaximizerStrategy } from "../strategies/yield-maximizer.js";
import { createLogger } from "../utils/logger.js";
import { scoreOpportunitiesWithAi } from "../ai/market-scorer.js";
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

  // Optional enrichment: disabled by default for devnet reliability.
  if (CONFIG.ENABLE_TOKENS_ENRICHMENT) {
    try {
      const marketIds = events.flatMap((e) => e.markets?.map((m) => m.id) ?? []);
      if (marketIds.length > 0) {
        const tokenMeta = await jupiterTokens.getTokens(marketIds.slice(0, 50));
        log.info(`Enriched ${tokenMeta.size} markets with Jupiter token metadata`);
      }
    } catch (err) {
      log.warn("Token metadata enrichment failed (non-fatal)", err);
    }
  } else {
    log.info("Token enrichment disabled (ENABLE_TOKENS_ENRICHMENT=false)");
  }

  for (const vaultConfig of getAllVaultConfigs()) {
    const strategy = strategies[vaultConfig.strategyType];
    const ruleScored = strategy.scoreEvents(events);

    let top: ScoredOpportunity[];
    try {
      top = await scoreOpportunitiesWithAi(vaultConfig.strategyType, ruleScored, events);
    } catch (err) {
      log.warn(`[${vaultConfig.name}] AI scoring failed; using rules-only opportunities`, err);
      top = ruleScored.slice(0, 20);
    }

    top = top.slice(0, 20);
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

  await persistOpportunitiesSnapshot();

  log.info("Market scan complete");
}

/** PROMPT: store top opportunities in a simple JSON file (in addition to memory). */
async function persistOpportunitiesSnapshot(): Promise<void> {
  try {
    const dir = path.join(process.cwd(), "data");
    await fs.mkdir(dir, { recursive: true });
    const snapshot: Record<string, ScoredOpportunity[]> = {};
    for (const [key, opps] of latestOpportunities.entries()) {
      snapshot[key] = opps;
    }
    const file = path.join(dir, "opportunities.json");
    await fs.writeFile(
      file,
      JSON.stringify({ updatedAt: new Date().toISOString(), vaults: snapshot }, null, 2),
      "utf-8",
    );
    log.info(`Wrote opportunity snapshot to ${file}`);
  } catch (err) {
    log.warn("Failed to persist opportunities.json (non-fatal)", err);
  }
}

export function getOpportunities(strategyType: VaultStrategyType): ScoredOpportunity[] {
  return latestOpportunities.get(strategyType) ?? [];
}

export function getStrategy(strategyType: VaultStrategyType): BaseStrategy {
  return strategies[strategyType];
}
