import type { ScoredOpportunityAiMeta, VaultStrategyType } from "../types/index.js";

/** Structured LLM output per market (PROMPT 5). */
export type LlmMarketScore = Omit<ScoredOpportunityAiMeta, "source">;

/** Batch input for one LLM call (up to 5 markets). */
export interface MarketScoreBatchItem {
  marketId: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  buyYesPriceUsd: number;
  buyNoPriceUsd: number;
  volume24h: number;
  volumeTotal: number;
  daysToResolution: number;
  /** Strategy's preliminary side before AI review */
  strategySide: "yes" | "no";
}

export function passesAiGate(
  strategyType: VaultStrategyType,
  score: LlmMarketScore,
  strategySide: "yes" | "no",
): boolean {
  if (score.recommended_side === "SKIP") return false;

  const minConviction =
    strategyType === "safe-consensus" ? 80 : strategyType === "macro-contrarian" ? 60 : 70;

  if (score.conviction < minConviction) return false;
  if (score.resolution_clarity <= 70) return false;
  if (score.risk_flags.length > 0) return false;

  return aiSideMatchesStrategy(score, strategySide);
}

/** Map YES/NO to yes/no and require match with strategy side. */
export function aiSideMatchesStrategy(
  score: LlmMarketScore,
  strategySide: "yes" | "no",
): boolean {
  if (score.recommended_side === "SKIP") return false;
  const ai = score.recommended_side.toLowerCase() as "yes" | "no";
  return ai === strategySide;
}
