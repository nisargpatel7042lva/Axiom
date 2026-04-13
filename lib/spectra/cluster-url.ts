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

/** RPC URL: explicit env wins; otherwise public cluster endpoint for `NEXT_PUBLIC_SOLANA_NETWORK`. */
export function getSolanaRpcEndpoint(): string {
  const custom = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (custom) return custom;
  return clusterApiUrl(clusterToWalletAdapterNetwork(getNetwork()));
}
