import axios, { type AxiosInstance } from "axios";
import { CONFIG } from "../config.js";
import { withRetry } from "../utils/retry.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("jupiter-tokens");

export interface JupiterToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  tags: string[];
  daily_volume: number | null;
  created_at: string | null;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string | null;
  extensions: Record<string, unknown>;
}

function normalizeToken(raw: unknown): JupiterToken | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const source =
    (obj.token && typeof obj.token === "object" ? (obj.token as Record<string, unknown>) : obj);

  const address = String(source.address ?? source.mint ?? "");
  if (!address) return null;
  return {
    address,
    name: String(source.name ?? ""),
    symbol: String(source.symbol ?? ""),
    decimals: Number(source.decimals ?? 0) || 0,
    logoURI: source.logoURI ? String(source.logoURI) : null,
    tags: Array.isArray(source.tags) ? source.tags.map(String) : [],
    daily_volume: source.daily_volume ? Number(source.daily_volume) : null,
    created_at: source.created_at ? String(source.created_at) : null,
    freeze_authority: source.freeze_authority ? String(source.freeze_authority) : null,
    mint_authority: source.mint_authority ? String(source.mint_authority) : null,
    permanent_delegate: source.permanent_delegate ? String(source.permanent_delegate) : null,
    minted_at: source.minted_at ? String(source.minted_at) : null,
    extensions: (source.extensions as Record<string, unknown>) ?? {},
  };
}

const tokenCache = new Map<string, { token: JupiterToken; cachedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Jupiter Tokens API — token metadata, verification status, organic scores.
 * Used to enrich prediction market token data in the scanner and UI.
 * Routed through the unified Jupiter Developer Platform API key.
 */
class JupiterTokensService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.JUPITER_TOKENS_BASE,
      timeout: 10_000,
      headers: {
        ...(CONFIG.JUPITER_API_KEY && { "x-api-key": CONFIG.JUPITER_API_KEY }),
      },
    });
  }

  /**
   * Fetch all tradable tokens on Solana (strict list).
   */
  async getAllTokens(): Promise<JupiterToken[]> {
    return withRetry(
      async () => {
        // Compatibility: tokens deployments may expose /mints/tradable (v2) or /solana (v1).
        try {
          const { data } = await this.client.get<JupiterToken[]>("/mints/tradable");
          log.info(`Fetched ${data.length} tokens from Jupiter Tokens API`);
          return data;
        } catch {
          const { data } = await this.client.get<JupiterToken[]>("/solana");
          log.info(`Fetched ${data.length} tokens from Jupiter Tokens API (fallback)`);
          return data;
        }
      },
      "getAllTokens",
      { maxAttempts: 2 },
    );
  }

  /**
   * Look up a single token by mint address.
   * Uses in-memory cache to avoid repeated calls.
   */
  async getToken(mint: string): Promise<JupiterToken | null> {
    const cached = tokenCache.get(mint);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.token;
    }

    try {
      let data: unknown;
      try {
        ({ data } = await this.client.get<JupiterToken>(`/mint/${mint}`));
      } catch {
        ({ data } = await this.client.get<JupiterToken>(`/solana/${mint}`));
      }
      const normalized = normalizeToken(data);
      if (!normalized) return null;
      tokenCache.set(mint, { token: normalized, cachedAt: Date.now() });
      return normalized;
    } catch {
      log.debug(`Token not found: ${mint}`);
      return null;
    }
  }

  /**
   * Batch-lookup token metadata for multiple mints.
   * Returns a map of mint → token info for found tokens.
   */
  async getTokens(mints: string[]): Promise<Map<string, JupiterToken>> {
    const results = new Map<string, JupiterToken>();
    const uncached: string[] = [];

    for (const mint of mints) {
      const cached = tokenCache.get(mint);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        results.set(mint, cached.token);
      } else {
        uncached.push(mint);
      }
    }

    // Fetch uncached tokens individually (Tokens API doesn't have a batch endpoint)
    for (const mint of uncached) {
      const token = await this.getToken(mint);
      if (token) results.set(mint, token);
    }

    return results;
  }
}

export const jupiterTokens = new JupiterTokensService();
