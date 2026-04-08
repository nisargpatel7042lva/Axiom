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
   * Strategy-specific scoring weight (combined with base score).
   */
  abstract strategyScore(event: PredictionEvent, market: PredictionMarket): number;

  /**
   * Determine which side to take.
   */
  abstract recommendedSide(event: PredictionEvent, market: PredictionMarket): "yes" | "no";

  /**
   * Whether a held position should be exited based on current market state.
   */
  abstract shouldExit(currentPrice: number, entryPrice: number, market: PredictionMarket): boolean;

  /**
   * Full scoring pipeline: filter → score → rank.
   * Returns scored opportunities sorted by score descending.
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

        const volumeWeight = this.normalizeVolume(market.volumeTotal);
        const timeWeight = this.timeToResolutionScore(daysToResolution);
        const stratWeight = this.strategyScore(event, market);
        const score = price * volumeWeight * timeWeight * stratWeight;

        opportunities.push({
          eventId: event.id,
          marketId: market.id,
          title: event.title || market.title,
          category: event.category,
          probability: market.buyYesPriceUsd,
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

  // ------------------------------------------------------------------
  // Shared helpers
  // ------------------------------------------------------------------

  protected daysUntil(dateStr: string): number {
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.max(0, (target - now) / (1000 * 60 * 60 * 24));
  }

  /**
   * Normalize volume into 0–1 range using a logarithmic scale.
   * $100k maps to ~0.5, $1M maps to ~1.0.
   */
  protected normalizeVolume(volume: number): number {
    if (volume <= 0) return 0;
    return Math.min(1, Math.log10(volume / 10_000) / Math.log10(100));
  }

  /**
   * Markets resolving soon score higher (more capital-efficient).
   * <3 days → 1.0, 30 days → 0.5, >90 days → 0.2.
   */
  protected timeToResolutionScore(days: number): number {
    if (days <= 3) return 1.0;
    if (days <= 14) return 0.8;
    if (days <= 30) return 0.5;
    if (days <= 60) return 0.3;
    return 0.2;
  }

  /**
   * Calculate position size in USDC based on vault NAV and max position %.
   */
  calculatePositionSize(vaultNav: number): number {
    return vaultNav * this.config.maxPositionPct;
  }
}
