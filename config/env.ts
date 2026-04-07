/**
 * Typed environment access. Call getters at runtime (not at module top-level in shared modules)
 * so missing optional keys do not break `next build` for static pages.
 */

function readRaw(key: string): string | undefined {
  const v = process.env[key];
  if (v === undefined || v === "") return undefined;
  return v;
}

/** Throws if unset — use for secrets and mandatory public config. */
export function requiredEnv(name: string): string {
  const v = readRaw(name);
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

/** Returns undefined when unset; optional `defaultValue` when provided. */
export function optionalEnv(
  name: string,
  defaultValue?: string,
): string | undefined {
  return readRaw(name) ?? defaultValue;
}

export function requiredPublicEnv(name: `NEXT_PUBLIC_${string}`): string {
  return requiredEnv(name);
}

/**
 * Solana JSON-RPC — must be your RPC Fast endpoint (Helius is not used as RPC per product spec).
 */
export function getRpcFastUrl(): string {
  return requiredPublicEnv("NEXT_PUBLIC_SOLANA_RPC_URL");
}

/** Helius API key for DAS / enhanced APIs (not the RPC URL). */
export function getHeliusApiKey(): string | undefined {
  return optionalEnv("HELIUS_API_KEY");
}

export function getKirapayApiKey(): string | undefined {
  return optionalEnv("KIRAPAY_API_KEY");
}

export function getKirapayApiBase(): string | undefined {
  return optionalEnv("KIRAPAY_API_BASE_URL");
}

export function getDodoApiKey(): string | undefined {
  return optionalEnv("DODO_API_KEY");
}

export function getDodoWebhookSecret(): string | undefined {
  return optionalEnv("DODO_WEBHOOK_SECRET");
}

/** Server-side only Jupiter key if you use pro endpoints; optional. */
export function getJupiterApiKey(): string | undefined {
  return optionalEnv("JUPITER_API_KEY");
}

export const env = {
  get rpcFastUrl() {
    return getRpcFastUrl();
  },
  get heliusApiKey() {
    return getHeliusApiKey();
  },
  get kirapayApiKey() {
    return getKirapayApiKey();
  },
  get kirapayApiBase() {
    return getKirapayApiBase();
  },
  get dodoApiKey() {
    return getDodoApiKey();
  },
  get dodoWebhookSecret() {
    return getDodoWebhookSecret();
  },
  get jupiterApiKey() {
    return getJupiterApiKey();
  },
} as const;
