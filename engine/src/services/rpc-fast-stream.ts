/**
 * RPC Fast real-time account streaming.
 *
 * Uses @solana/web3.js WebSocket subscriptions backed by the RPC Fast endpoint.
 * When RPC_FAST_HTTP_URL is set the Connection automatically derives the WS URL
 * (https:// → wss://) — giving sub-100ms account change notifications vs ~30s polling.
 *
 * If RPC_FAST_HTTP_URL is not configured the module is a no-op; cron-based polling
 * in nav-calculator.ts continues to work as the sole update mechanism.
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { CONFIG } from "../config.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("rpc-fast-stream");

type AccountChangeCallback = (vaultId: number) => void;

const subscriptionIds: number[] = [];
let streamConnection: Connection | null = null;

/**
 * Subscribe to account changes for all vault PDAs via RPC Fast WebSocket.
 * Fires `onAccountChange` whenever the vault's on-chain state mutates.
 */
export function startRpcFastStream(
  vaultPdas: { vaultId: number; pda: PublicKey }[],
  onAccountChange: AccountChangeCallback,
): void {
  if (!CONFIG.RPC_FAST_GRPC_URL && !CONFIG.RPC_URL.includes("rpcfast")) {
    log.info("RPC Fast not configured — skipping WebSocket stream, cron polling active");
    return;
  }

  try {
    // Connection automatically converts https:// → wss:// for WebSocket
    streamConnection = new Connection(CONFIG.RPC_URL, {
      commitment: "confirmed",
      wsEndpoint: CONFIG.RPC_URL.replace(/^https?:\/\//, "wss://"),
    });

    log.info(`Starting RPC Fast WebSocket stream for ${vaultPdas.length} vault(s)...`);

    for (const { vaultId, pda } of vaultPdas) {
      const subId = streamConnection.onAccountChange(
        pda,
        (_accountInfo) => {
          log.info(`[Vault ${vaultId}] Account change detected via RPC Fast — triggering NAV update`);
          onAccountChange(vaultId);
        },
        "confirmed",
      );
      subscriptionIds.push(subId);
      log.info(`  Subscribed to vault ${vaultId} PDA: ${pda.toBase58()} (sub #${subId})`);
    }

    log.info("RPC Fast WebSocket stream active");
  } catch (err) {
    log.error("Failed to start RPC Fast stream — falling back to cron only", err);
  }
}

/** Stop all WebSocket subscriptions (call on engine shutdown). */
export async function stopRpcFastStream(): Promise<void> {
  if (!streamConnection || subscriptionIds.length === 0) return;

  await Promise.all(
    subscriptionIds.map((id) =>
      streamConnection!.removeAccountChangeListener(id).catch(() => {}),
    ),
  );
  subscriptionIds.length = 0;
  streamConnection = null;
  log.info("RPC Fast WebSocket stream stopped");
}

export function isRpcFastStreamActive(): boolean {
  return subscriptionIds.length > 0;
}
