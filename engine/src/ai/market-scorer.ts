import { createLogger } from "../utils/logger.js";
import type {
  PredictionEvent,
  PredictionMarket,
  ScoredOpportunity,
  ScoredOpportunityAiMeta,
  VaultStrategyType,
} from "../types/index.js";
import type { MarketScore } from "./types.js";
import { passesAiGate } from "./types.js";

const log = createLogger("algo-scorer");

const TOP_CANDIDATES = 25;

function algoScore(
  strategyType: VaultStrategyType,
  market: PredictionMarket,
  strategySide: "yes" | "no",
  daysToResolution: number,
): MarketScore {
  const prob = market.buyYesPriceUsd;
  const distFromCenter = Math.abs(prob - 0.5);
  const risk_flags: string[] = [];

  // Log-scale volume clarity: 1k→~60, 100k→~75, 1M→~90
  const volLog = Math.log10(Math.max(1, market.volumeTotal));
  const volScore = Math.min(100, (volLog / 6) * 100);
  const resolution_clarity =
    market.status === "active"
      ? Math.round(55 + volScore * 0.35)
      : Math.round(40 + volScore * 0.2);

  if (market.volumeTotal < 5_000) risk_flags.push("low_volume");
  if (daysToResolution < 0.5 && distFromCenter < 0.15) risk_flags.push("imminent_uncertain");

  let conviction: number;
  let mispricing_signal = 0;

  if (strategyType === "safe-consensus") {
    // High-prob markets — conviction rises with distance from 50%
    conviction = Math.round(50 + distFromCenter * 90);
  } else if (strategyType === "macro-contrarian") {
    // Conviction from crowd certainty; mispricing signal = how far market leans
    conviction = Math.min(95, Math.max(62, Math.round(58 + distFromCenter * 90)));
    mispricing_signal = Math.max(-50, Math.min(50, Math.round((0.5 - prob) * 80)));
  } else {
    // yield-maximizer: reward high probability and quick resolution
    const timeBonus = daysToResolution <= 7 ? 5 : daysToResolution <= 30 ? 2 : 0;
    conviction = Math.min(100, Math.round(prob * 95 + timeBonus));
  }

  return {
    marketId: market.id,
    conviction: Math.max(0, Math.min(100, conviction)),
    mispricing_signal,
    resolution_clarity,
    reasoning: "Algorithmic scoring",
    recommended_side: strategySide === "yes" ? "YES" : "NO",
    risk_flags,
  };
}

export async function scoreOpportunitiesWithAi(
  strategyType: VaultStrategyType,
  opportunities: ScoredOpportunity[],
  events: PredictionEvent[],
): Promise<ScoredOpportunity[]> {
  const candidates = opportunities.slice(0, TOP_CANDIDATES);
  const enriched: ScoredOpportunity[] = [];

  for (const opp of candidates) {
    const event = events.find((e) => e.id === opp.eventId);
    const market = event?.markets?.find((m) => m.id === opp.marketId) ?? null;
    if (!event || !market) continue;

    const score = algoScore(strategyType, market, opp.side, opp.daysToResolution);
    if (!passesAiGate(strategyType, score, opp.side)) continue;

    const ai: ScoredOpportunityAiMeta = { ...score, source: "algo" };
    enriched.push({ ...opp, score: opp.score * (score.conviction / 100), ai });
  }

  enriched.sort((a, b) => b.score - a.score);
  log.info(`[${strategyType}] Algo filter: ${candidates.length} candidates → ${enriched.length} passed`);
  return enriched;
}
