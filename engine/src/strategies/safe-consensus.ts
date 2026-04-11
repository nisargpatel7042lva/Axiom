import { BaseStrategy } from "./base-strategy.js";
import { getVaultConfig } from "../config.js";
import type { PredictionEvent, PredictionMarket } from "../types/index.js";

/**
 * Safe Consensus: buys >85% probability events.
 * Low risk, targets 8–15% APY via near-certain outcomes.
 */
export class SafeConsensusStrategy extends BaseStrategy {
  constructor() {
    super(getVaultConfig("safe-consensus"));
  }

  passesFilter(event: PredictionEvent, market: PredictionMarket): boolean {
    const prob = market.buyYesPriceUsd;
    const days = this.daysUntil(event.endDate);

    return (
      prob >= this.config.minProbability &&
      prob <= this.config.maxProbability &&
      market.volumeTotal >= this.config.minVolume &&
      days > 0 &&
      days <= this.config.maxDaysToResolution
    );
  }

  recommendedSide(_event: PredictionEvent, market: PredictionMarket): "yes" | "no" {
    // Safe consensus always buys the dominant side
    return market.buyYesPriceUsd >= 0.5 ? "yes" : "no";
  }

  shouldExit(currentPrice: number, entryPrice: number, market: PredictionMarket): boolean {
    // Exit if probability drops below 0.75 (lost confidence)
    // or if we're at a significant loss (>15% from entry)
    const prob = market.buyYesPriceUsd;
    const loss = (entryPrice - currentPrice) / entryPrice;
    return prob < 0.75 || loss > 0.15;
  }
}
