import type { ScoredOpportunityAiMeta, VaultStrategyType } from "../types/index.js";

export type MarketScore = Omit<ScoredOpportunityAiMeta, "source">;

export function passesAiGate(
  strategyType: VaultStrategyType,
  score: MarketScore,
  strategySide: "yes" | "no",
): boolean {
  if (score.recommended_side === "SKIP") return false;

  // Thresholds calibrated to the actual conviction values produced at each strategy's
  // minimum configured probability (env-overridable). Old values (80/70) were
  // unreachable at the configured mins (0.55 / 0.52), silently blocking all markets.
  const minConviction =
    strategyType === "safe-consensus" ? 54 : strategyType === "macro-contrarian" ? 60 : 52;

  if (score.conviction < minConviction) return false;
  if (score.resolution_clarity <= 70) return false;
  if (score.risk_flags.length > 0) return false;

  const side = score.recommended_side.toLowerCase() as "yes" | "no";
  return side === strategySide;
}
