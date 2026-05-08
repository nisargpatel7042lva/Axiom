import { getSupabaseClient } from "@/lib/supabase/client";
import { snsIdentityService, type AgentIdentity } from "@/lib/services/sns-identity";

/**
 * Store and manage agent identities for vault strategies
 */
export class VaultAgentIdentityStore {
  private supabase = getSupabaseClient();

  /**
   * Create or update an agent identity for a vault
   */
  async upsertAgentIdentity(params: {
    vaultId: string;
    agentId: string;
    agentName: string;
    ownerWallet: string;
    strategies: string[];
  }): Promise<AgentIdentity | null> {
    if (!this.supabase) return null;

    try {
      const agent = snsIdentityService.createAgentIdentity({
        agentId: params.agentId,
        agentName: params.agentName,
        ownerWallet: params.ownerWallet,
        strategies: params.strategies,
      });

      // Store agent identity in Supabase
      const { error } = await this.supabase
        .from("vault_agents")
        .upsert(
          {
            vault_id: params.vaultId,
            agent_id: params.agentId,
            agent_name: params.agentName,
            owner_wallet: params.ownerWallet,
            reputation: agent.reputation,
            strategies: JSON.stringify(params.strategies),
            created_at: new Date(agent.createdAt).toISOString(),
          },
          { onConflict: "vault_id" }
        );

      if (error) {
        process.env.NODE_ENV !== "production" && console.error("Failed to store agent identity:", error);
        return null;
      }

      return agent;
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error("Error upserting agent identity:", err);
      return null;
    }
  }

  /**
   * Get agent identity for a vault
   */
  async getAgentIdentity(vaultId: string): Promise<AgentIdentity | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from("vault_agents")
        .select("*")
        .eq("vault_id", vaultId)
        .single();

      if (error || !data) return null;

      return {
        wallet: data.owner_wallet,
        agentId: data.agent_id,
        agentName: data.agent_name,
        reputation: data.reputation,
        strategies: JSON.parse(data.strategies || "[]"),
        createdAt: new Date(data.created_at).getTime(),
      };
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error("Error fetching agent identity:", err);
      return null;
    }
  }

  /**
   * Update agent reputation after strategy performance
   */
  async updateAgentReputation(
    vaultId: string,
    performanceScore: number
  ): Promise<AgentIdentity | null> {
    const agent = await this.getAgentIdentity(vaultId);
    if (!agent) return null;

    const updated = snsIdentityService.updateAgentReputation(agent, performanceScore);

    if (!this.supabase) return updated;

    try {
      const { error } = await this.supabase
        .from("vault_agents")
        .update({ reputation: updated.reputation })
        .eq("vault_id", vaultId);

      if (error) {
        process.env.NODE_ENV !== "production" && console.error("Failed to update reputation:", error);
        return null;
      }

      return updated;
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error("Error updating agent reputation:", err);
      return null;
    }
  }
}

export const vaultAgentIdentityStore = new VaultAgentIdentityStore();
