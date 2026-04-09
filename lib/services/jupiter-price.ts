/**
 * Jupiter Price API v2 wrapper.
 *
 * Uses the single Jupiter Developer Platform API key from env to fetch
 * real-time USD prices for any Solana token mint. Designed to serve both
 * the frontend (portfolio valuation) and the engine (NAV calculation).
 *
 * Endpoint: GET https://api.jup.ag/price/v2?ids={mint1,mint2,...}
 * Docs:     https://developers.jup.ag
 */

const JUPITER_PRICE_BASE = "https://api.jup.ag/price/v2";

function getApiKey(): string | undefined {
  if (typeof process !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_JUPITER_API_KEY ??
      process.env.JUPITER_API_KEY
    );
  }
  return undefined;
}

export interface JupiterPriceData {
  id: string;
  type: string;
  price: string;
}

export interface JupiterPriceResponse {
  data: Record<string, JupiterPriceData | null>;
  timeTaken: number;
}

/**
 * Fetch USD prices for one or more token mints.
 *
 * @param mints - Array of Solana mint addresses (base58)
 * @returns Map of mint → USD price (number). Missing mints are omitted.
 */
export async function getTokenPrices(
  mints: string[]
): Promise<Map<string, number>> {
  if (mints.length === 0) return new Map();

  const ids = mints.join(",");
  const url = `${JUPITER_PRICE_BASE}?ids=${ids}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const apiKey = getApiKey();
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });

  if (!res.ok) {
    throw new Error(`Jupiter Price API ${res.status}: ${res.statusText}`);
  }

  const json: JupiterPriceResponse = await res.json();
  const prices = new Map<string, number>();

  for (const [mint, entry] of Object.entries(json.data)) {
    if (entry?.price) {
      prices.set(mint, parseFloat(entry.price));
    }
  }

  return prices;
}

/**
 * Convenience: fetch the price of a single mint.
 * Returns `null` if the price is unavailable.
 */
export async function getTokenPrice(mint: string): Promise<number | null> {
  const prices = await getTokenPrices([mint]);
  return prices.get(mint) ?? null;
}
