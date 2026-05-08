import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

import type { SolanaCluster } from "./constants";
import { getNetwork } from "./constants";

export function clusterToWalletAdapterNetwork(
  cluster: SolanaCluster,
): WalletAdapterNetwork {
  switch (cluster) {
    case "mainnet-beta":
      return WalletAdapterNetwork.Mainnet;
    case "testnet":
      return WalletAdapterNetwork.Testnet;
    case "devnet":
    default:
      return WalletAdapterNetwork.Devnet;
  }
}

/**
 * RPC endpoint priority:
 *  1. NEXT_PUBLIC_RPC_FAST_HTTP_URL — browser-safe RPC Fast alias (preferred)
 *  2. RPC_FAST_HTTP_URL             — server-only fallback (SSR / API routes)
 *  3. NEXT_PUBLIC_SOLANA_RPC_URL    — custom override
 *  4. Public cluster endpoint for NEXT_PUBLIC_SOLANA_NETWORK
 */
export function getSolanaRpcEndpoint(): string {
  const rpcFastPublic = process.env.NEXT_PUBLIC_RPC_FAST_HTTP_URL?.trim();
  if (rpcFastPublic) return rpcFastPublic;

  const rpcFast = process.env.RPC_FAST_HTTP_URL?.trim();
  if (rpcFast) return rpcFast;

  const custom = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (custom) return custom;

  return clusterApiUrl(clusterToWalletAdapterNetwork(getNetwork()));
}

/** True when the app is connected through RPC Fast. */
export function isRpcFast(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_RPC_FAST_HTTP_URL?.trim() ||
    process.env.RPC_FAST_HTTP_URL?.trim(),
  );
}
