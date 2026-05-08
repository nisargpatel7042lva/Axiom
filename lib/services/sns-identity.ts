import { PublicKey, Connection } from "@solana/web3.js";
import {
  getFavoriteDomain,
  getDomainKeySync,
  NameRegistryState,
} from "@bonfida/spl-name-service";
import { getSolanaRpcEndpoint } from "@/lib/spectra/cluster-url";

export interface SnsIdentity {
  wallet: string;
  domain?: string; // e.g., "axiom.sol"
  displayName?: string;
  avatar?: string;
}

export interface AgentIdentity extends SnsIdentity {
  agentId: string;
  agentName: string;
  reputation: number; // 0-100 score
  strategies: string[];
  createdAt: number;
}

class SnsIdentityService {
  private connection: Connection | null = null;

  private getConnection(): Connection {
    if (!this.connection) {
      const endpoint = getSolanaRpcEndpoint();
      this.connection = new Connection(endpoint);
    }
    return this.connection;
  }

  /**
   * Resolve a .sol domain to a wallet address
   */
  async resolveDomain(domain: string): Promise<string | null> {
    try {
      const name = domain.endsWith(".sol") ? domain.slice(0, -4) : domain;
      const connection = this.getConnection();
      const { pubkey } = getDomainKeySync(name);
      const { registry } = await NameRegistryState.retrieve(connection, pubkey);
      return registry.owner.toBase58();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("Failed to resolve SNS domain:", error);
      return null;
    }
  }

  /**
   * Reverse resolve a wallet to its primary .sol domain
   */
  async resolveWallet(wallet: string): Promise<string | null> {
    try {
      const pubkey = new PublicKey(wallet);
      const connection = this.getConnection();
      // getFavoriteDomain does the reverse lookup (pubkey → .sol domain)
      // It throws if no favorite domain is registered for this wallet
      const { reverse } = await getFavoriteDomain(connection, pubkey);
      return `${reverse}.sol`;
    } catch {
      // No favorite domain registered — not an error, just no domain
      return null;
    }
  }

  /**
   * Get full identity profile for a wallet
   */
  async getIdentity(wallet: string): Promise<SnsIdentity | null> {
    try {
      const domain = await this.resolveWallet(wallet);

      return {
        wallet,
        domain: domain || undefined,
        displayName: domain?.replace(".sol", ""),
      };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("Failed to get identity:", error);
      return null;
    }
  }

  /**
   * Create agent identity (for vault strategy agents)
   */
  createAgentIdentity(params: {
    agentId: string;
    agentName: string;
    ownerWallet: string;
    strategies: string[];
  }): AgentIdentity {
    return {
      wallet: params.ownerWallet,
      agentId: params.agentId,
      agentName: params.agentName,
      reputation: 50, // Start at neutral
      strategies: params.strategies,
      createdAt: Date.now(),
    };
  }

  /**
   * Update agent reputation based on performance
   */
  updateAgentReputation(
    agent: AgentIdentity,
    performanceScore: number
  ): AgentIdentity {
    const alpha = 0.3;
    const newReputation = agent.reputation * (1 - alpha) + performanceScore * alpha;

    return {
      ...agent,
      reputation: Math.max(0, Math.min(100, newReputation)),
    };
  }
}

export const snsIdentityService = new SnsIdentityService();
