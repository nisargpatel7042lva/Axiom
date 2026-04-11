import { BaseStrategy } from "./base-strategy.js";
import { getVaultConfig } from "../config.js";
import type { PredictionEvent, PredictionMarket } from "../types/index.js";

/**
 * Macro Contrarian: targets mispriced 40–65% probability events
 * in politics, economics, and crypto categories.
 */
export class MacroContrarianStrategy extends BaseStrategy {
  constructor() {
    super(getVaultConfig("macro-contrarian"));
  }

  passesFilter(event: PredictionEvent, market: PredictionMarket): boolean {
    const prob = market.buyYesPriceUsd;

    const categoryMatch =
      this.config.categories.length === 0 ||
      this.config.categories.includes(event.category?.toLowerCase());

    return (
      prob >= this.config.minProbability &&
      prob <= this.config.maxProbability &&
      market.volumeTotal >= this.config.minVolume &&
      categoryMatch &&
      this.daysUntil(event.endDate) > 0
    );
  }

  recommendedSide(event: PredictionEvent, market: PredictionMarket): "yes" | "no" {
    // Contrarian takes the less popular side — if crowd says >50% YES, we lean NO
    // But only when the mispricing favors that side.
    const prob = market.buyYesPriceUsd;
    // If market is 40-50%, we think YES is underpriced → buy YES
    // If market is 50-65%, we think NO is underpriced → buy NO
    return prob < 0.50 ? "yes" : "no";
  }

  shouldExit(currentPrice: number, entryPrice: number, market: PredictionMarket): boolean {
    // Exit on 25% loss or if market moves strongly against our thesis (>80% certainty the other way)
    const loss = (entryPrice - currentPrice) / entryPrice;
    const prob = market.buyYesPriceUsd;
    return loss > 0.25 || prob > 0.80 || prob < 0.20;
  }
}
