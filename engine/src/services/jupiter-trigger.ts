import axios, { type AxiosInstance } from "axios";
import { CONFIG } from "../config.js";
import { withRetry } from "../utils/retry.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("jupiter-trigger");

export interface TriggerOrderParams {
  maker: string;
  payer: string;
  inputMint: string;
  outputMint: string;
  makingAmount: string;
  takingAmount: string;
  expiredAt?: string;
}

export interface TriggerOrder {
  orderId: string;
  maker: string;
  inputMint: string;
  outputMint: string;
  makingAmount: string;
  takingAmount: string;
  remainingMakingAmount: string;
  remainingTakingAmount: string;
  status: "active" | "filled" | "cancelled" | "expired";
  createdAt: string;
  expiredAt: string | null;
}

export interface CreateTriggerResponse {
  transaction: string;
  orderId: string;
}

/**
 * Jupiter Trigger API — smart limit orders for prediction market entries/exits.
 * Instead of market-ordering into positions, we can set limit entries
 * (e.g., "buy YES on BTC>120K only if price drops to $0.60").
 * Routed through the unified Jupiter Developer Platform API key.
 */
class JupiterTriggerService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.JUPITER_TRIGGER_BASE,
      timeout: 15_000,
      headers: {
        "Content-Type": "application/json",
        ...(CONFIG.JUPITER_API_KEY && { "x-api-key": CONFIG.JUPITER_API_KEY }),
      },
    });
  }

  /**
   * Create a trigger (limit) order for a prediction market entry.
   * Allows the engine to set price targets instead of market-buying.
   */
  async createOrder(params: TriggerOrderParams): Promise<CreateTriggerResponse> {
    return withRetry(
      async () => {
        const { data } = await this.client.post<CreateTriggerResponse>("/orders", params);
        log.info(`Trigger order created: ${data.orderId} (${params.inputMint} → ${params.outputMint})`);
        return data;
      },
      "createTriggerOrder",
    );
  }

  /**
   * Get all active trigger orders for a wallet.
   */
  async getOrders(wallet: string): Promise<TriggerOrder[]> {
    return withRetry(
      async () => {
        const { data } = await this.client.get<{ orders: TriggerOrder[] }>("/orders", {
          params: { wallet },
        });
        return data.orders ?? [];
      },
      "getTriggerOrders",
    );
  }

  /**
   * Cancel a trigger order. Returns the cancel transaction to sign.
   */
  async cancelOrder(orderId: string, maker: string): Promise<{ transaction: string }> {
    return withRetry(
      async () => {
        const { data } = await this.client.post<{ transaction: string }>(`/orders/${orderId}/cancel`, {
          maker,
        });
        log.info(`Trigger order cancelled: ${orderId}`);
        return data;
      },
      `cancelTriggerOrder(${orderId})`,
    );
  }

  /**
   * Create a limit entry for a prediction market position.
   * Convenience wrapper that sets up a trigger order to buy a prediction
   * token when it reaches a target price.
   */
  async createLimitEntry(params: {
    ownerPubkey: string;
    usdcMint: string;
    predictionTokenMint: string;
    usdcAmount: number;
    targetPrice: number;
    expiresInHours?: number;
  }): Promise<CreateTriggerResponse> {
    const makingAmount = Math.floor(params.usdcAmount * 1e6).toString();
    const tokensToReceive = params.usdcAmount / params.targetPrice;
    const takingAmount = Math.floor(tokensToReceive * 1e6).toString();

    const expiredAt = params.expiresInHours
      ? new Date(Date.now() + params.expiresInHours * 60 * 60 * 1000).toISOString()
      : undefined;

    log.info(
      `Creating limit entry: $${params.usdcAmount} USDC → prediction token @ $${params.targetPrice} (expires: ${expiredAt ?? "never"})`,
    );

    return this.createOrder({
      maker: params.ownerPubkey,
      payer: params.ownerPubkey,
      inputMint: params.usdcMint,
      outputMint: params.predictionTokenMint,
      makingAmount,
      takingAmount,
      expiredAt,
    });
  }
}

export const jupiterTrigger = new JupiterTriggerService();
