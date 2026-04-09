import axios, { type AxiosInstance } from "axios";
import { CONFIG } from "../config.js";
import { withRetry } from "../utils/retry.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("jupiter-price");

export interface TokenPrice {
  id: string;
  type: "derivedPrice";
  price: string;
}

export interface PriceResponse {
  data: Record<string, TokenPrice>;
  timeTaken: number;
}

/**
 * Jupiter Price API v2 — real-time USD pricing for any Solana token.
 * Used for NAV calculation (USDC price validation) and portfolio display.
 * Routed through the unified Jupiter Developer Platform API key.
 */
class JupiterPriceService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.JUPITER_PRICE_BASE,
      timeout: 10_000,
      headers: {
        ...(CONFIG.JUPITER_API_KEY && { "x-api-key": CONFIG.JUPITER_API_KEY }),
      },
    });
  }

  /**
   * Fetch USD prices for one or more token mints.
   * @param mints Array of mint addresses (e.g., USDC mint, vault share mints)
   * @returns Map of mint address → USD price as number
   */
  async getPrices(mints: string[]): Promise<Map<string, number>> {
    if (mints.length === 0) return new Map();

    return withRetry(
      async () => {
        const ids = mints.join(",");
        const { data } = await this.client.get<PriceResponse>("", {
          params: { ids },
        });

        const prices = new Map<string, number>();
        for (const [mint, info] of Object.entries(data.data ?? {})) {
          prices.set(mint, parseFloat(info.price));
        }

        log.debug(`Fetched prices for ${prices.size}/${mints.length} tokens`);
        return prices;
      },
      "getPrices",
      { maxAttempts: 3 },
    );
  }

  /**
   * Get a single token's USD price.
   */
  async getPrice(mint: string): Promise<number | null> {
    const prices = await this.getPrices([mint]);
    return prices.get(mint) ?? null;
  }

  /**
   * Validate that USDC is trading at ~$1 (sanity check for NAV calc).
   * Returns the USDC price or 1.0 if the API is unreachable.
   */
  async getUsdcPrice(): Promise<number> {
    try {
      const price = await this.getPrice(CONFIG.USDC_MINT);
      if (price && price > 0.95 && price < 1.05) {
        return price;
      }
      log.warn(`USDC price out of range: ${price}, defaulting to 1.0`);
      return 1.0;
    } catch {
      return 1.0;
    }
  }
}

export const jupiterPrice = new JupiterPriceService();
