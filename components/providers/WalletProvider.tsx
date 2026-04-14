"use client";

import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";

import { SafePlayAgreementGate } from "@/components/legal/SafePlayAgreementGate";
import { getSolanaRpcEndpoint } from "@/lib/spectra/cluster-url";

import "@solana/wallet-adapter-react-ui/styles.css";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => getSolanaRpcEndpoint(), []);

  /** Empty: Wallet Standard wallets (Phantom, Solflare, etc.) are merged by `@solana/wallet-adapter-react`. */
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SafePlayAgreementGate>{children}</SafePlayAgreementGate>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
