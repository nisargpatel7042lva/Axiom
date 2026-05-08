"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { snsIdentityService, type SnsIdentity } from "@/lib/services/sns-identity";

export function useSnsIdentity() {
  const { publicKey } = useWallet();
  const [identity, setIdentity] = useState<SnsIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setIdentity(null);
      return;
    }

    const wallet = publicKey.toBase58();
    
    const fetchIdentity = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = await snsIdentityService.getIdentity(wallet);
        setIdentity(id);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") console.error("Error fetching SNS identity:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch identity");
        // Still set wallet even if domain resolution fails
        setIdentity({ wallet });
      } finally {
        setLoading(false);
      }
    };

    fetchIdentity();
  }, [publicKey]);

  return { identity, loading, error };
}
