import axios from "axios";
import { CONFIG } from "../config.js";

interface PredictionEvent {
  id: string;
  title: string;
  category: string;
  probability: number;
  volume: number;
  endDate: string;
  markets: PredictionMarket[];
}

interface PredictionMarket {
  id: string;
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  liquidity: number;
}

export interface ScoredOpportunity {
  eventId: string;
  marketId: string;
  title: string;
  category: string;
  probability: number;
  volume: number;
  side: "yes" | "no";
  expectedValue: number;
  vaultFit: string[];
}

export class MarketScanner {
  private opportunities: ScoredOpportunity[] = [];

  async run(): Promise<ScoredOpportunity[]> {
    console.log("[market-scanner] Fetching prediction events...");

    try {
      const { data } = await axios.get<{ events: PredictionEvent[] }>(
        `${CONFIG.JUPITER_PREDICTION_API}/events`,
        { timeout: 10_000 },
      );

      const events = data.events ?? [];
      console.log(`[market-scanner] Found ${events.length} events`);

      this.opportunities = [];

      for (const event of events) {
        for (const market of event.markets ?? []) {
          const scored = this.scoreOpportunity(event, market);
          if (scored) {
            this.opportunities.push(scored);
          }
        }
      }

      this.opportunities.sort((a, b) => b.expectedValue - a.expectedValue);
      console.log(
        `[market-scanner] ${this.opportunities.length} scored opportunities`,
      );

      return this.opportunities;
    } catch (err) {
      console.error("[market-scanner] API call failed:", err);
      return this.opportunities;
    }
  }

  private scoreOpportunity(
    event: PredictionEvent,
    market: PredictionMarket,
  ): ScoredOpportunity | null {
    const prob = event.probability;
    const vaultFit: string[] = [];

    // Safe Consensus: >85% probability
    if (prob >= 0.85) {
      vaultFit.push("safe-consensus");
    }

    // Macro Contrarian: 40-65% mispriced events
    if (prob >= 0.4 && prob <= 0.65) {
      vaultFit.push("macro-contrarian");
    }

    // Yield Maximizer: >75% conviction
    if (prob >= 0.75) {
      vaultFit.push("yield-maximizer");
    }

    if (vaultFit.length === 0) return null;

    const side = prob > 0.5 ? "yes" : "no";
    const price = side === "yes" ? market.yesPrice : market.noPrice;
    const impliedProb = price;
    const expectedValue = prob - impliedProb;

    if (expectedValue <= 0) return null;

    return {
      eventId: event.id,
      marketId: market.id,
      title: event.title,
      category: event.category,
      probability: prob,
      volume: market.volume24h,
      side,
      expectedValue,
      vaultFit,
    };
  }

  getOpportunities(): ScoredOpportunity[] {
    return this.opportunities;
  }
}
