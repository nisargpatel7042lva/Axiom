import type { ScoredOpportunityAiMeta, VaultStrategyType } from "../types/index.js";

export type MarketScore = Omit<ScoredOpportunityAiMeta, "source">;

export function passesAiGate(
  strategyType: VaultStrategyType,
  score: MarketScore,
  strategySide: "yes" | "no",
): boolean {
  if (score.recommended_side === "SKIP") return false;

  const minConviction =
    strategyType === "safe-consensus" ? 80 : strategyType === "macro-contrarian" ? 60 : 70;

  if (score.conviction < minConviction) return false;
  if (score.resolution_clarity <= 70) return false;
  if (score.risk_flags.length > 0) return false;

  const side = score.recommended_side.toLowerCase() as "yes" | "no";
  return side === strategySide;
}
