import axios, { type AxiosInstance } from "axios";
import { CONFIG } from "../config.js";
import { withRetry } from "../utils/retry.js";
import { createLogger } from "../utils/logger.js";
import type {
  PredictionEvent,
  PredictionMarket,
  PredictionPosition,
  OrderParams,
  OrderResponse,
} from "../types/index.js";

const log = createLogger("jupiter-prediction");

class JupiterPredictionService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.JUPITER_PREDICTION_BASE,
      timeout: 15_000,
      headers: {
        "Content-Type": "application/json",
        ...(CONFIG.JUPITER_API_KEY && {
          "x-api-key": CONFIG.JUPITER_API_KEY,
        }),
      },
    });
  }

  async getActiveEvents(
    category?: string,
    provider?: "polymarket" | "kalshi",
  ): Promise<PredictionEvent[]> {
    return withRetry(
      async () => {
        const params: Record<string, string> = { filter: "active" };
        if (category) params.category = category;
        if (provider) params.provider = provider;

        const { data } = await this.client.get<{ events: PredictionEvent[] }>("/events", {
          params,
        });
        log.info(`Fetched ${data.events?.length ?? 0} active events`);
        return data.events ?? [];
      },
      "getActiveEvents",
      { maxAttempts: 3 },
    );
  }

  async getMarket(marketId: string): Promise<PredictionMarket> {
    return withRetry(
      async () => {
        const { data } = await this.client.get<PredictionMarket>(`/markets/${marketId}`);
        return data;
      },
      `getMarket(${marketId})`,
    );
  }

  async createOrder(params: OrderParams): Promise<OrderResponse> {
    return withRetry(
      async () => {
        const { data } = await this.client.post<OrderResponse>("/orders", params);
        log.info(`Order created for market ${params.marketId} (buy=${params.isBuy}, yes=${params.isYes})`);
        return data;
      },
      `createOrder(${params.marketId})`,
    );
  }

  async getPositions(ownerPubkey: string): Promise<PredictionPosition[]> {
    return withRetry(
      async () => {
        const { data } = await this.client.get<{ positions: PredictionPosition[] }>("/positions", {
          params: { ownerPubkey },
        });
        return data.positions ?? [];
      },
      "getPositions",
    );
  }

  async sellPosition(params: {
    ownerPubkey: string;
    marketId: string;
    isYes: boolean;
    contracts: string;
  }): Promise<OrderResponse> {
    return withRetry(
      async () => {
        const orderParams: OrderParams = {
          ownerPubkey: params.ownerPubkey,
          marketId: params.marketId,
          isYes: params.isYes,
          isBuy: false,
          depositAmount: params.contracts,
          depositMint: CONFIG.USDC_MINT,
        };
        const { data } = await this.client.post<OrderResponse>("/orders", orderParams);
        log.info(`Sell order created for market ${params.marketId}`);
        return data;
      },
      `sellPosition(${params.marketId})`,
    );
  }
}

export const jupiterPrediction = new JupiterPredictionService();
