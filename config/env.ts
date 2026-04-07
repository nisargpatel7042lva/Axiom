function readRaw(key: string): string | undefined {
  const v = process.env[key];
  if (v === undefined || v === "") return undefined;
  return v;
}

export function requiredEnv(name: string): string {
  const v = readRaw(name);
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export function optionalEnv(
  name: string,
  defaultValue?: string,
): string | undefined {
  return readRaw(name) ?? defaultValue;
}

export function requiredPublicEnv(name: `NEXT_PUBLIC_${string}`): string {
  return requiredEnv(name);
}

export function getSolanaRpcUrl(): string {
  return (
    optionalEnv("NEXT_PUBLIC_SOLANA_RPC_URL") ??
    "https://api.devnet.solana.com"
  );
}

export function getJupiterApiKey(): string | undefined {
  return optionalEnv("JUPITER_API_KEY");
}

export const env = {
  get solanaRpcUrl() {
    return getSolanaRpcUrl();
  },
  get jupiterApiKey() {
    return getJupiterApiKey();
  },
} as const;
