import axios, { type AxiosInstance } from "axios";

import { CONFIG } from "../config.js";
import { withRetry } from "../utils/retry.js";
import { createLogger } from "../utils/logger.js";
import type { PredictionEvent, PredictionMarket, PredictionPosition } from "../types/index.js";

const log = createLogger("jupiter-prediction");

/** OpenAPI: filter is `new` | `live` | `trending` — not `active` (returns 400). */
const EVENT_LIST_FILTER = (process.env.JUPITER_PREDICTION_EVENT_FILTER || "live").trim() as
  | "new"
  | "live"
  | "trending";

function asIsoFromTimestamp(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  // Some APIs return seconds, others milliseconds.
  const ms = value > 1e12 ? value : value * 1000;
  const iso = new Date(ms).toISOString();
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function pickEventEndDate(raw: Record<string, unknown>, meta: Record<string, unknown>): string {
  const closeTime = meta.closeTime;
  if (typeof closeTime === "string" && closeTime.length > 0 && !Number.isNaN(Date.parse(closeTime))) {
    return closeTime;
  }

  const numericCandidates: unknown[] = [
    raw.closeAt,
    raw.endAt,
    raw.resolveAt,
    meta.closeAt,
    meta.endAt,
    meta.resolveAt,
  ];
  for (const candidate of numericCandidates) {
    const iso = asIsoFromTimestamp(candidate);
    if (iso) return iso;
  }

  // Last-resort fallback: keep event scannable instead of forcing 0-day expiry.
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

function mapMarketStatus(api: string): PredictionMarket["status"] {
  if (api === "open") return "active";
  if (api === "closed") return "resolved";
  return "cancelled";
}

function mapResolution(
  result: string | null | undefined,
): PredictionMarket["resolution"] {
  if (result === "yes" || result === "no") return result;
  return null;
}

function normalizeUsdPrice(value: unknown): number {
  const n = Number(value ?? 0) || 0;
  if (!Number.isFinite(n) || n <= 0) return 0;
  // Jupiter prediction can return micro-USD ints (e.g. 450000 => 0.45).
  if (n > 1) return n / 1_000_000;
  return n;
}

function normalizeMarket(raw: Record<string, unknown>, eventId: string): PredictionMarket {
  const meta = (raw.metadata as Record<string, unknown> | undefined) ?? {};
  const pricing = (raw.pricing as Record<string, unknown> | undefined) ?? {};
  const status = typeof raw.status === "string" ? raw.status : "closed";
  const yes = normalizeUsdPrice(pricing.buyYesPriceUsd);
  const noRaw = normalizeUsdPrice(pricing.buyNoPriceUsd);
  const no = noRaw > 0 ? noRaw : Math.max(0, 1 - yes);

  return {
    id: String(raw.marketId ?? ""),
    eventId,
    title: String(meta.title ?? ""),
    buyYesPriceUsd: yes,
    buyNoPriceUsd: no,
    // `pricing.volume` is the field the Jupiter API currently populates for 24 h
    // trading volume.  `volumeTotal` falls back to the same field when no
    // dedicated cumulative-volume key is present in the response.
    volume24h: Number(pricing.volume ?? 0) || 0,
    volumeTotal: Number(pricing.volumeTotal ?? pricing.cumulativeVolume ?? pricing.totalVolume ?? pricing.volume ?? 0) || 0,
    liquidity: 0,
    status: mapMarketStatus(status),
    resolution: mapResolution(raw.result as string | null | undefined),
  };
}

function normalizeEvent(raw: Record<string, unknown>): PredictionEvent {
  const eventId = String(raw.eventId ?? "");
  const meta = (raw.metadata as Record<string, unknown> | undefined) ?? {};
  const title = String(meta.title ?? meta.subtitle ?? eventId);
  const endDate = pickEventEndDate(raw, meta);

  const marketsRaw = Array.isArray(raw.markets) ? raw.markets : [];
  const markets = marketsRaw
    .map((m) => normalizeMarket(m as Record<string, unknown>, eventId))
    .filter((m) => m.id.length > 0);

  const provider =
    typeof raw.provider === "string" && (raw.provider === "kalshi" || raw.provider === "polymarket")
      ? raw.provider
      : "polymarket";

  return {
    id: eventId,
    title,
    description: String(meta.subtitle ?? ""),
    category: typeof raw.category === "string" ? raw.category : "all",
    provider,
    status: raw.isActive === false ? "cancelled" : "active",
    endDate,
    markets,
  };
}

function extractEventsPayload(data: unknown): unknown[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.data)) return d.data;
  if (Array.isArray(d.events)) return d.events;
  return [];
}

class JupiterPredictionService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.JUPITER_PREDICTION_BASE,
      timeout: 15_000,
      headers: {
        "Content-Type": "application/json",
        ...(CONFIG.JUPITER_API_KEY && { "x-api-key": CONFIG.JUPITER_API_KEY }),
      },
    });
  }

  async getActiveEvents(
    category?: string,
    provider?: "polymarket" | "kalshi",
  ): Promise<PredictionEvent[]> {
    if (!CONFIG.JUPITER_API_KEY) {
      log.warn("JUPITER_API_KEY missing — Prediction API requests may fail (401/403).");
    }

    return withRetry(async () => {
      const params: Record<string, string | boolean> = {
        filter: EVENT_LIST_FILTER,
        includeMarkets: true,
      };
      if (category) params.category = category;
      if (provider) params.provider = provider;

      const { data } = await this.client.get("/events", { params });
      const rows = extractEventsPayload(data);
      const events = rows
        .map((row) => normalizeEvent(row as Record<string, unknown>))
        .filter((e) => e.id.length > 0);

      log.info(`Fetched ${events.length} prediction events (filter=${EVENT_LIST_FILTER})`);
      return events;
    }, "getActiveEvents", { maxAttempts: 3 });
  }

  async getMarket(marketId: string): Promise<unknown> {
    return withRetry(async () => {
      const { data } = await this.client.get(`/markets/${marketId}`);
      return data;
    }, `getMarket(${marketId})`);
  }

  async createOrder(params: {
    ownerPubkey: string;
    marketId: string;
    isYes: boolean;
    isBuy: boolean;
    depositAmount: string;
    depositMint: string;
  }): Promise<unknown> {
    return withRetry(async () => {
      const { data } = await this.client.post("/orders", params);
      log.info(
        `Order created for market ${params.marketId} (buy=${params.isBuy}, yes=${params.isYes})`,
      );
      return data;
    }, `createOrder(${params.marketId})`);
  }

  async getPositions(ownerPubkey: string): Promise<PredictionPosition[]> {
    return withRetry(async () => {
      const { data } = await this.client.get("/positions", {
        params: { ownerPubkey },
      });
      const d = data as Record<string, unknown>;
      const raw = Array.isArray(d.positions) ? d.positions : Array.isArray(d.data) ? d.data : [];
      return raw.map((p) => normalizePosition(p as Record<string, unknown>));
    }, "getPositions");
  }

  async sellPosition(params: {
    ownerPubkey: string;
    marketId: string;
    isYes: boolean;
    contracts: string;
  }): Promise<unknown> {
    return withRetry(async () => {
      const orderParams = {
        ownerPubkey: params.ownerPubkey,
        marketId: params.marketId,
        isYes: params.isYes,
        isBuy: false,
        depositAmount: params.contracts,
        depositMint: CONFIG.USDC_MINT,
      };
      const { data } = await this.client.post("/orders", orderParams);
      log.info(`Sell order created for market ${params.marketId}`);
      return data;
    }, `sellPosition(${params.marketId})`);
  }
}

function normalizePosition(raw: Record<string, unknown>): PredictionPosition {
  const marketRaw = (raw.market as Record<string, unknown> | undefined) ?? {};
  const meta = (marketRaw.metadata as Record<string, unknown> | undefined) ?? {};
  const pricing = (marketRaw.pricing as Record<string, unknown> | undefined) ?? {};
  const side = raw.isYes === true || raw.isYes === "true";
  const price = Number(pricing.buyYesPriceUsd ?? raw.currentPrice ?? 0) || 0;

  return {
    marketId: String(raw.marketId ?? marketRaw.marketId ?? ""),
    ownerPubkey: String(raw.ownerPubkey ?? ""),
    isYes: side,
    contracts: String(raw.contracts ?? raw.size ?? "0"),
    avgEntryPrice: Number(raw.avgEntryPrice ?? 0) || 0,
    currentPrice: price,
    pnlUsd: Number(raw.pnlUsd ?? 0) || 0,
    market: {
      id: String(marketRaw.marketId ?? raw.marketId ?? ""),
      title: String(meta.title ?? ""),
      status: mapMarketStatus(String(marketRaw.status ?? "open")),
      resolution: mapResolution(marketRaw.result as string | null | undefined),
    },
  };
}

export const jupiterPrediction = new JupiterPredictionService();
