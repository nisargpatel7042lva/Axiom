import type { AiScoreSource } from "../types/index.js";
import type { LlmMarketScore } from "./types.js";

export interface CachedScore {
  score: LlmMarketScore;
  source: AiScoreSource;
  cachedAt: number;
  /** YES price snapshot used to skip re-scoring when price barely moves */
  buyYesPriceUsd: number;
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const PRICE_EPS = 0.05; // 5%

const store = new Map<string, CachedScore>();

function key(strategyType: string, marketId: string): string {
  return `${strategyType}:${marketId}`;
}

export function getCachedScore(
  strategyType: string,
  marketId: string,
  currentYesPrice: number,
): Pick<CachedScore, "score" | "source"> | null {
  const k = key(strategyType, marketId);
  const hit = store.get(k);
  if (!hit) return null;

  const age = Date.now() - hit.cachedAt;
  if (age > SIX_HOURS_MS) {
    store.delete(k);
    return null;
  }

  const prev = hit.buyYesPriceUsd;
  if (prev > 0 && Math.abs(currentYesPrice - prev) / prev < PRICE_EPS) {
    return { score: hit.score, source: hit.source };
  }

  // Price moved enough — invalidate
  store.delete(k);
  return null;
}

export function setCachedScore(
  strategyType: string,
  marketId: string,
  buyYesPriceUsd: number,
  score: LlmMarketScore,
  source: AiScoreSource,
): void {
  store.set(key(strategyType, marketId), {
    score,
    source,
    cachedAt: Date.now(),
    buyYesPriceUsd,
  });
}
