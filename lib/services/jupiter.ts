import axios from "axios";

const JUPITER_PRICE_BASE = "https://api.jup.ag/price/v2";
const JUPITER_TOKENS_BASE = "https://api.jup.ag/tokens/v1";

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_JUPITER_API_KEY ?? process.env.JUPITER_API_KEY ?? "";
}

function headers() {
  const key = getApiKey();
  return key ? { "x-api-key": key } : {};
}

// ---------------------------------------------------------------------------
// Price API v2
// ---------------------------------------------------------------------------

export interface TokenPrice {
  id: string;
  type: string;
  price: string;
}

/**
 * Fetch USD prices for Solana tokens via Jupiter Price API v2.
 * Used on the frontend for portfolio value display and vault share pricing.
 */
export async function getTokenPrices(
  mints: string[],
): Promise<Record<string, number>> {
  if (mints.length === 0) return {};

  try {
    const { data } = await axios.get<{ data: Record<string, TokenPrice> }>(
      JUPITER_PRICE_BASE,
      {
        params: { ids: mints.join(",") },
        headers: headers(),
        timeout: 10_000,
      },
    );

    const prices: Record<string, number> = {};
    for (const [mint, info] of Object.entries(data.data ?? {})) {
      prices[mint] = parseFloat(info.price);
    }
    return prices;
  } catch (err) {
    console.error("[jupiter-price] Failed to fetch prices:", err);
    return {};
  }
}

/**
 * Get a single token's USD price.
 */
export async function getTokenPrice(mint: string): Promise<number | null> {
  const prices = await getTokenPrices([mint]);
  return prices[mint] ?? null;
}

// ---------------------------------------------------------------------------
// Tokens API
// ---------------------------------------------------------------------------

export interface JupiterTokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  tags: string[];
  daily_volume: number | null;
}

/**
 * Look up token metadata by mint address.
 * Used in PositionsTable to show token logos and names.
 */
export async function getTokenInfo(
  mint: string,
): Promise<JupiterTokenInfo | null> {
  try {
    const { data } = await axios.get<JupiterTokenInfo>(
      `${JUPITER_TOKENS_BASE}/solana/${mint}`,
      {
        headers: headers(),
        timeout: 10_000,
      },
    );
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch all verified tokens on Solana (strict list).
 */
export async function getAllTokens(): Promise<JupiterTokenInfo[]> {
  try {
    const { data } = await axios.get<JupiterTokenInfo[]>(
      `${JUPITER_TOKENS_BASE}/solana`,
      {
        headers: headers(),
        timeout: 15_000,
      },
    );
    return data;
  } catch {
    return [];
  }
}
