import { BaseStrategy } from "./base-strategy.js";
import { getVaultConfig } from "../config.js";
import type { PredictionEvent, PredictionMarket } from "../types/index.js";

/**
 * Yield Maximizer: 70% Jupiter Lend, 30% in >75% conviction predictions.
 * Favours quick-resolving, high-volume, high-probability markets for
 * consistent small wins alongside lending yield.
 */
export class YieldMaximizerStrategy extends BaseStrategy {
  constructor() {
    super(getVaultConfig("yield-maximizer"));
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
    return market.buyYesPriceUsd >= 0.5 ? "yes" : "no";
  }

  shouldExit(currentPrice: number, entryPrice: number, market: PredictionMarket): boolean {
    // Conservative exits: any drop below 0.65 probability or 10% loss
    const prob = market.buyYesPriceUsd;
    const loss = (entryPrice - currentPrice) / entryPrice;
    return prob < 0.65 || loss > 0.10;
  }
}
