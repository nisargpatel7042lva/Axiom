/**
 * Jupiter Price v3 client used by hooks/portfolio.
 *
 * Jupiter's public price endpoint is safe to call from the browser. If a
 * `NEXT_PUBLIC_JUPITER_API_KEY` is set it is attached as `x-api-key`; do
 * not put secret/server-only keys under `NEXT_PUBLIC_*`.
 */

const JUPITER_PRICE_BASE =
  process.env.NEXT_PUBLIC_JUPITER_PRICE_BASE?.trim() ||
  "https://api.jup.ag/price/v3";

function getClientApiKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_JUPITER_API_KEY;
  return k && k.length > 0 ? k : undefined;
}

type PriceRow = { usdPrice?: number; price?: string | number };
type PriceResponseShape =
  | Record<string, PriceRow>
  | { data?: Record<string, PriceRow> };

function parsePrices(
  raw: PriceResponseShape | null | undefined,
  mints: string[],
): Map<string, number> {
  const out = new Map<string, number>();
  if (!raw || typeof raw !== "object") return out;

  const wrapped = (raw as { data?: Record<string, PriceRow> }).data;
  const rows: Record<string, PriceRow> | undefined =
    wrapped && typeof wrapped === "object"
      ? wrapped
      : (raw as Record<string, PriceRow>);
  if (!rows) return out;

  for (const mint of mints) {
    const row = rows[mint];
    if (!row) continue;
    if (typeof row.usdPrice === "number" && Number.isFinite(row.usdPrice)) {
      out.set(mint, row.usdPrice);
      continue;
    }
    if (row.price !== undefined) {
      const n = typeof row.price === "string" ? parseFloat(row.price) : row.price;
      if (Number.isFinite(n)) out.set(mint, n);
    }
  }
  return out;
}

/**
 * Fetch USD prices for the given mint addresses. Returns a Map keyed by mint.
 * Mints the API doesn't know about are simply absent from the result.
 */
export async function getTokenPrices(
  mints: string[],
): Promise<Map<string, number>> {
  const unique = Array.from(new Set(mints.filter(Boolean)));
  if (unique.length === 0) return new Map();

  const url = `${JUPITER_PRICE_BASE}?ids=${encodeURIComponent(unique.join(","))}`;
  const headers: Record<string, string> = { accept: "application/json" };
  const key = getClientApiKey();
  if (key) headers["x-api-key"] = key;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Jupiter price request failed: ${res.status}`);
  }
  const body = (await res.json()) as PriceResponseShape;
  return parsePrices(body, unique);
}

export async function getTokenPrice(mint: string): Promise<number | null> {
  const prices = await getTokenPrices([mint]);
  return prices.get(mint) ?? null;
}
