import axios, { type AxiosInstance } from "axios";

import { CONFIG } from "../config.js";
import { withRetry } from "../utils/retry.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("jupiter-price");

function parsePriceResponse(
  raw: unknown,
  mints: string[],
): Map<string, number> {
  const prices = new Map<string, number>();
  if (!raw || typeof raw !== "object") return prices;

  const o = raw as Record<string, unknown>;

  if (o.data && typeof o.data === "object") {
    for (const [mint, info] of Object.entries(o.data as Record<string, { price?: string }>)) {
      const p = info?.price;
      if (p) prices.set(mint, parseFloat(p));
    }
    return prices;
  }

  for (const mint of mints) {
    const row = o[mint] as { usdPrice?: number; price?: string } | undefined;
    if (row && typeof row.usdPrice === "number" && Number.isFinite(row.usdPrice)) {
      prices.set(mint, row.usdPrice);
    }
  }
  if (prices.size > 0) return prices;

  for (const [mint, row] of Object.entries(o)) {
    if (mint === "timeTaken" || mint === "data") continue;
    if (!row || typeof row !== "object") continue;
    const r = row as { usdPrice?: number; price?: string };
    if (typeof r.usdPrice === "number" && Number.isFinite(r.usdPrice)) {
      prices.set(mint, r.usdPrice);
    } else if (r.price) {
      prices.set(mint, parseFloat(r.price));
    }
  }
  return prices;
}

class JupiterPriceService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.JUPITER_PRICE_BASE,
      timeout: 10_000,
      headers: {
        ...(CONFIG.JUPITER_API_KEY && { "x-api-key": CONFIG.JUPITER_API_KEY }),
      },
    });
  }

  async getPrices(mints: string[]): Promise<Map<string, number>> {
    if (mints.length === 0) return new Map();
    return withRetry(async () => {
      const ids = mints.join(",");
      const { data } = await this.client.get("", { params: { ids } });
      const prices = parsePriceResponse(data, mints);
      log.debug(`Fetched prices for ${prices.size}/${mints.length} tokens`);
      return prices;
    }, "getPrices", { maxAttempts: 3 });
  }

  async getPrice(mint: string): Promise<number | null> {
    const prices = await this.getPrices([mint]);
    return prices.get(mint) ?? null;
  }

  async getUsdcPrice(): Promise<number> {
    try {
      const price = await this.getPrice(CONFIG.USDC_MINT);
      if (price && price > 0.95 && price < 1.05) return price;
      log.warn(`USDC price out of range: ${price}, defaulting to 1.0`);
      return 1.0;
    } catch {
      return 1.0;
    }
  }
}

export const jupiterPrice = new JupiterPriceService();
