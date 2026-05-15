"use client";

import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useEffect, useMemo, useRef } from "react";
import { MotionConfig } from "framer-motion";

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

function MwaHostElevator() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // @solana-mobile/wallet-standard-mobile appends a shadow-DOM host <div>
    // to <body> when the user initiates a mobile wallet connection. The modal
    // inside has z-index: 1 which buries it under all page overlays. We detect
    // the host by the Google-Fonts <link> preloads it puts in its light DOM and
    // give it position:relative + z-index:9999 so its stacking context sits
    // above the topbar (z-50) but below the SafePlay gate (z-10000).
    const elevate = (node: Node) => {
      if (!(node instanceof HTMLElement) || node.tagName !== "DIV") return;
      if (!node.id && !node.className && node.querySelector('link[href*="googleapis"]')) {
        node.style.position = "fixed";
        node.style.inset = "0";
        node.style.zIndex = "9999";
        node.style.pointerEvents = "none";
      }
    };

    document.body.querySelectorAll("div:not([id]):not([class])").forEach(elevate);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => m.addedNodes.forEach(elevate));
    });
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, []);

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
          {/* Global: respect prefers-reduced-motion for all framer-motion components */}
          <MotionConfig reducedMotion="user">
            <WalletTelemetryBridge />
            <MwaHostElevator />
            <SafePlayAgreementGate>{children}</SafePlayAgreementGate>
          </MotionConfig>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
