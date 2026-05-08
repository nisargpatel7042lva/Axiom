"use client";

import { useEffect, useState } from "react";
import { vaultAgentIdentityStore } from "@/lib/services/vault-agent-identity";
import type { AgentIdentity } from "@/lib/services/sns-identity";

export function useVaultAgentIdentity(vaultId: string) {
  const [agent, setAgent] = useState<AgentIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      setLoading(true);
      setError(null);
      try {
        const agentData = await vaultAgentIdentityStore.getAgentIdentity(vaultId);
        setAgent(agentData);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") console.error("Error fetching vault agent:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch agent");
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [vaultId]);

  return { agent, loading, error };
}
