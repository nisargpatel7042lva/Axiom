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

type CreateOrderV1Body = {
  inputMint: string;
  outputMint: string;
  maker: string;
  payer: string;
  params: {
    makingAmount: string;
    takingAmount: string;
    expiredAt?: string;
  };
};

function normalizeOrderId(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const o = raw as Record<string, unknown>;
  const direct = o.orderId ?? o.order_id ?? o.id;
  return direct ? String(direct) : "";
}

function normalizeCreateOrderResponse(data: unknown): CreateTriggerResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Unexpected Trigger createOrder response shape");
  }
  const d = data as Record<string, unknown>;
  const tx = d.transaction ?? d.tx ?? d.serializedTransaction;
  const orderId = normalizeOrderId(d);
  if (!tx || !orderId) {
    throw new Error("Trigger createOrder missing transaction/orderId");
  }
  return { transaction: String(tx), orderId };
}

function normalizeOrders(data: unknown): TriggerOrder[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const raw =
    (Array.isArray(d.orders) && d.orders) ||
    (Array.isArray(d.data) && d.data) ||
    (Array.isArray(d.triggerOrders) && d.triggerOrders) ||
    [];
  return raw.map((row) => {
    const o = row as Record<string, unknown>;
    return {
      orderId: normalizeOrderId(o),
      maker: String(o.maker ?? ""),
      inputMint: String(o.inputMint ?? ""),
      outputMint: String(o.outputMint ?? ""),
      makingAmount: String(o.makingAmount ?? o.initialMakingAmount ?? "0"),
      takingAmount: String(o.takingAmount ?? o.initialTakingAmount ?? "0"),
      remainingMakingAmount: String(o.remainingMakingAmount ?? "0"),
      remainingTakingAmount: String(o.remainingTakingAmount ?? "0"),
      status: String(o.status ?? "active") as TriggerOrder["status"],
      createdAt: String(o.createdAt ?? o.created_at ?? ""),
      expiredAt: o.expiredAt ? String(o.expiredAt) : null,
    };
  });
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
        // Compatibility: some deployments expose /orders, others /createOrder with nested params.
        try {
          const { data } = await this.client.post("/orders", params);
          const out = normalizeCreateOrderResponse(data);
          log.info(`Trigger order created: ${out.orderId} (${params.inputMint} → ${params.outputMint})`);
          return out;
        } catch {
          const body: CreateOrderV1Body = {
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            maker: params.maker,
            payer: params.payer,
            params: {
              makingAmount: params.makingAmount,
              takingAmount: params.takingAmount,
              ...(params.expiredAt ? { expiredAt: params.expiredAt } : {}),
            },
          };
          const { data } = await this.client.post("/createOrder", body);
          const out = normalizeCreateOrderResponse(data);
          log.info(`Trigger order created (fallback): ${out.orderId} (${params.inputMint} → ${params.outputMint})`);
          return out;
        }
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
        try {
          const { data } = await this.client.get("/orders", {
            params: { wallet },
          });
          return normalizeOrders(data);
        } catch {
          try {
            const { data } = await this.client.get("/getTriggerOrders", {
              params: { maker: wallet },
            });
            return normalizeOrders(data);
          } catch {
            try {
              const { data } = await this.client.get("/getTriggerOrders", {
                params: { user: wallet },
              });
              return normalizeOrders(data);
            } catch (err) {
              // Non-fatal path for engine loops; treat unknown trigger schema as no orders.
              log.warn(`Trigger order lookup failed, defaulting to []: ${err instanceof Error ? err.message : String(err)}`);
              return [];
            }
          }
        }
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
        let data: unknown;
        try {
          ({ data } = await this.client.post(`/orders/${orderId}/cancel`, { maker }));
        } catch {
          ({ data } = await this.client.post("/cancelOrder", { orderId, maker }));
        }
        const tx =
          data && typeof data === "object"
            ? (data as Record<string, unknown>).transaction ??
              (data as Record<string, unknown>).tx
            : null;
        if (!tx) throw new Error("Trigger cancel response missing transaction");
        log.info(`Trigger order cancelled: ${orderId}`);
        return { transaction: String(tx) };
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
