"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo, useEffect, useRef } from "react";
import posthog from "posthog-js";
import { useWallet } from "@solana/wallet-adapter-react";

import "@solana/wallet-adapter-react-ui/styles.css";

const FALLBACK = clusterApiUrl(WalletAdapterNetwork.Devnet);

function WalletEventTracker() {
  const { publicKey, connected, wallet } = useWallet();
  const prevConnected = useRef(false);

  useEffect(() => {
    if (connected && !prevConnected.current && publicKey) {
      const address = publicKey.toBase58();
      posthog.identify(address, { wallet_address: address, wallet_name: wallet?.adapter.name });
      posthog.capture("wallet_connected", {
        wallet_address: address,
        wallet_name: wallet?.adapter.name,
      });
    } else if (!connected && prevConnected.current) {
      posthog.capture("wallet_disconnected");
      posthog.reset();
    }
    prevConnected.current = connected;
  }, [connected, publicKey, wallet]);

  return null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() || FALLBACK;

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletEventTracker />
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
