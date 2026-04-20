/**
 * Record-shaped wrapper around `./jupiter-price` for hooks that prefer a
 * plain object (e.g. `useJupiterPrices`).
 */
import { getTokenPrices as getTokenPricesMap } from "./jupiter-price";

export async function getTokenPrices(
  mints: string[],
): Promise<Record<string, number>> {
  const map = await getTokenPricesMap(mints);
  const out: Record<string, number> = {};
  for (const [mint, price] of map) out[mint] = price;
  return out;
}

export { getTokenPrice } from "./jupiter-price";
