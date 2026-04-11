import Decimal from "decimal.js";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatUsd(value: number | Decimal): string {
  const n = value instanceof Decimal ? value.toNumber() : value;
  if (!Number.isFinite(n)) return usdFormatter.format(0);
  return usdFormatter.format(n);
}

export function formatUsdCompact(value: number | Decimal): string {
  const n = value instanceof Decimal ? value.toNumber() : value;
  if (!Number.isFinite(n)) return compactUsd.format(0);
  return compactUsd.format(n);
}

export function formatPercent(value: number | Decimal, fractionDigits = 2): string {
  const n = value instanceof Decimal ? value.toNumber() : value;
  if (!Number.isFinite(n)) return `${(0).toFixed(fractionDigits)}%`;
  return `${n.toFixed(fractionDigits)}%`;
}

export function formatFeesTicker(value: number | Decimal): string {
  const n = value instanceof Decimal ? value.toNumber() : value;
  if (!Number.isFinite(n)) return "0.000000";
  return n.toFixed(6);
}

/** Vault share tokens (9 decimals on-chain) — display up to 4 fractional digits. */
export function formatShares(value: number): string {
  if (!Number.isFinite(value)) return "0.0000";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
}

export function decimalFromUnknown(v: string | number | Decimal): Decimal {
  if (v instanceof Decimal) return v;
  return new Decimal(v);
}
