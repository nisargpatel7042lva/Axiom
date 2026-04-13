"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";

import {
  SAFE_PLAY_AGREEMENT_VERSION,
  buildAgreementMessage,
} from "@/lib/safe-play/agreement";
import { bytesToBase64 } from "@/lib/safe-play/encode";
import { persistAcknowledgment, readStoredAck } from "@/lib/safe-play/storage";
import { verifyEd25519Acknowledgment } from "@/lib/safe-play/verify-signature";

export type SafePlayGateStatus =
  | "idle"
  | "checking"
  | "needs_signature"
  | "signing"
  | "ready"
  | "unsupported_wallet";

export function useSafePlayAcknowledgment() {
  const { connected, publicKey, signMessage } = useWallet();
  const [status, setStatus] = useState<SafePlayGateStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      setStatus("idle");
      setError(null);
      return;
    }

    if (signMessage === undefined) {
      setStatus("unsupported_wallet");
      setError(null);
      return;
    }

    let cancelled = false;
    setStatus("checking");
    setError(null);

    (async () => {
      const pk = publicKey.toBase58();
      const stored = readStoredAck(pk);
      if (
        stored &&
        stored.version === SAFE_PLAY_AGREEMENT_VERSION &&
        stored.publicKey === pk
      ) {
        const msg = new TextEncoder().encode(buildAgreementMessage(pk));
        const ok = await verifyEd25519Acknowledgment(
          msg,
          stored.signatureB64,
          publicKey,
        );
        if (!cancelled) setStatus(ok ? "ready" : "needs_signature");
      } else if (!cancelled) {
        setStatus("needs_signature");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, signMessage]);

  const signAgreement = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !signMessage) return false;
    setError(null);
    setStatus("signing");
    try {
      const text = buildAgreementMessage(publicKey.toBase58());
      const bytes = new TextEncoder().encode(text);
      const sig = await signMessage(bytes);
      persistAcknowledgment({
        version: SAFE_PLAY_AGREEMENT_VERSION,
        publicKey: publicKey.toBase58(),
        signatureB64: bytesToBase64(sig),
        signedAt: Date.now(),
      });
      setStatus("ready");
      return true;
    } catch (e) {
      setStatus("needs_signature");
      setError(
        e instanceof Error ? e.message : "Signature was rejected or failed.",
      );
      return false;
    }
  }, [publicKey, signMessage]);

  const requiresBlockingOverlay =
    connected &&
    status !== "ready" &&
    status !== "idle";

  return {
    status,
    error,
    signAgreement,
    requiresBlockingOverlay,
  };
}
