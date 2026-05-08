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

// ── Solana RPC (RPC Fast preferred) ────────────────────────────────

/**
 * Returns the active Solana RPC URL.
 * Priority: NEXT_PUBLIC_RPC_FAST_HTTP_URL → RPC_FAST_HTTP_URL → NEXT_PUBLIC_SOLANA_RPC_URL → public devnet.
 */
export function getSolanaRpcUrl(): string {
  return (
    optionalEnv("NEXT_PUBLIC_RPC_FAST_HTTP_URL") ??
    optionalEnv("RPC_FAST_HTTP_URL") ??
    optionalEnv("NEXT_PUBLIC_SOLANA_RPC_URL") ??
    "https://api.devnet.solana.com"
  );
}

/** True when connected through RPC Fast. Used for UI attribution. */
export function isRpcFastEnabled(): boolean {
  return Boolean(readRaw("NEXT_PUBLIC_RPC_FAST_HTTP_URL") || readRaw("RPC_FAST_HTTP_URL"));
}

// ── Jupiter Developer Platform ─────────────────────────────────────

export function getJupiterApiKey(): string | undefined {
  return (
    optionalEnv("JUPITER_API_KEY") ??
    optionalEnv("NEXT_PUBLIC_JUPITER_API_KEY")
  );
}

// ── Dune SIM ───────────────────────────────────────────────────────

export function getDuneSimApiKey(): string | undefined {
  return (
    optionalEnv("DUNE_SIM_API_KEY") ??
    optionalEnv("NEXT_PUBLIC_DUNE_SIM_API_KEY")
  );
}

// ── RPC Fast gRPC (Yellowstone streaming) ──────────────────────────

export function getRpcFastGrpcUrl(): string | undefined {
  return optionalEnv("RPC_FAST_GRPC_URL");
}

export const env = {
  get solanaRpcUrl() { return getSolanaRpcUrl(); },
  get jupiterApiKey() { return getJupiterApiKey(); },
  get duneSimApiKey() { return getDuneSimApiKey(); },
  get rpcFastHttpUrl() {
    return optionalEnv("NEXT_PUBLIC_RPC_FAST_HTTP_URL") ?? optionalEnv("RPC_FAST_HTTP_URL");
  },
  get rpcFastGrpcUrl() { return getRpcFastGrpcUrl(); },
  get isRpcFast() { return isRpcFastEnabled(); },
} as const;
