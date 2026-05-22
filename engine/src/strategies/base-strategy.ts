import type {
  VaultConfig,
  VaultStrategyType,
  ScoredOpportunity,
  PredictionEvent,
  PredictionMarket,
} from "../types/index.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("strategy");

export abstract class BaseStrategy {
  constructor(public readonly config: VaultConfig) {}

  get strategyType(): VaultStrategyType {
    return this.config.strategyType;
  }

  /**
   * Primary filter: does this market pass the strategy's basic criteria?
   */
  abstract passesFilter(event: PredictionEvent, market: PredictionMarket): boolean;

  /**
   * Determine which side to take.
   */
  abstract recommendedSide(event: PredictionEvent, market: PredictionMarket): "yes" | "no";

  /**
   * Whether a held position should be exited based on current market state.
   */
  abstract shouldExit(currentPrice: number, entryPrice: number, market: PredictionMarket): boolean;

  /**
   * PROMPT scoring: probability × volume_weight × time_to_resolution_score
   * Strategy differentiation comes from passesFilter(), not a separate multiplier.
   */
  scoreEvents(events: PredictionEvent[]): ScoredOpportunity[] {
    const opportunities: ScoredOpportunity[] = [];

    for (const event of events) {
      for (const market of event.markets ?? []) {
        if (market.status !== "active") continue;
        if (!this.passesFilter(event, market)) continue;

        const daysToResolution = this.daysUntil(event.endDate);
        const side = this.recommendedSide(event, market);
        const price = side === "yes" ? market.buyYesPriceUsd : market.buyNoPriceUsd;
        const probability = market.buyYesPriceUsd;

        const volumeWeight = this.normalizeVolume(market.volumeTotal);
        const timeWeight = this.timeToResolutionScore(daysToResolution);
        const score = probability * volumeWeight * timeWeight;

        opportunities.push({
          eventId: event.id,
          marketId: market.id,
          title: event.title || market.title,
          category: event.category,
          probability,
          volume: market.volume24h,
          volumeTotal: market.volumeTotal,
          side,
          price,
          expectedValue: (side === "yes" ? 1 - price : 1 - (1 - price)) * price,
          score,
          daysToResolution,
          vaultFit: [this.strategyType],
        });
      }
    }

    opportunities.sort((a, b) => b.score - a.score);
    log.info(
      `[${this.config.name}] Scored ${opportunities.length} opportunities from ${events.length} events`,
    );
    return opportunities;
  }

  protected daysUntil(dateStr: string): number {
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.max(0, (target - now) / (1000 * 60 * 60 * 24));
  }

  /**
   * Volume weight 0–1 (log scale). Clamped to [0, 1] so sub-10k markets produce
   * zero weight instead of a negative number that flips the sign of the score.
   */
  protected normalizeVolume(volume: number): number {
    if (volume <= 0) return 0;
    return Math.max(0, Math.min(1, Math.log10(volume / 10_000) / Math.log10(100)));
  }

  /**
   * Time-to-resolution score — sooner = higher weight.
   */
  protected timeToResolutionScore(days: number): number {
    if (days <= 3) return 1.0;
    if (days <= 14) return 0.8;
    if (days <= 30) return 0.5;
    if (days <= 60) return 0.3;
    return 0.2;
  }

  calculatePositionSize(vaultNav: number): number {
    return vaultNav * this.config.maxPositionPct;
  }
}
