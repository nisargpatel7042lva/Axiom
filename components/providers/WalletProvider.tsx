"use client";

import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useEffect, useMemo, useRef } from "react";

import { SafePlayAgreementGate } from "@/components/legal/SafePlayAgreementGate";
import { identifyWallet, resetIdentity, trackEvent } from "@/lib/analytics/client";
import { getSolanaRpcEndpoint } from "@/lib/spectra/cluster-url";

import "@solana/wallet-adapter-react-ui/styles.css";

function WalletTelemetryBridge() {
  const { connected, publicKey } = useWallet();
  const prevWallet = useRef<string | null>(null);

  useEffect(() => {
    const nextWallet = connected && publicKey ? publicKey.toBase58() : null;
    if (nextWallet && prevWallet.current !== nextWallet) {
      identifyWallet(nextWallet);
      trackEvent({
        name: "wallet_connect",
        wallet: nextWallet,
      });
    } else if (!nextWallet && prevWallet.current) {
      trackEvent({
        name: "wallet_disconnect",
        wallet: prevWallet.current,
      });
      resetIdentity();
    }
    prevWallet.current = nextWallet;
  }, [connected, publicKey]);

  return null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => getSolanaRpcEndpoint(), []);

  /** Empty: Wallet Standard wallets (Phantom, Solflare, etc.) are merged by `@solana/wallet-adapter-react`. */
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider container="#wallet-modal-portal">
          <WalletTelemetryBridge />
          <SafePlayAgreementGate>{children}</SafePlayAgreementGate>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
