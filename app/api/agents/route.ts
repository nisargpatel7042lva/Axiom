import { NextResponse } from "next/server";
import { vaultAgentIdentityStore } from "@/lib/services/vault-agent-identity";

const VAULT_AGENTS = [
  {
    vaultId: "safe-consensus",
    agentId: "axiom-agent-safe-001",
    agentName: "Safe Consensus Agent",
    ownerWallet: "system",
    strategies: ["High Probability", "Capital Preservation", "Jupiter Lend"],
  },
  {
    vaultId: "macro-contrarian",
    agentId: "axiom-agent-macro-001",
    agentName: "Macro Contrarian Agent",
    ownerWallet: "system",
    strategies: ["Mispriced Events", "Mid-Band (40–65%)", "Jupiter Lend"],
  },
  {
    vaultId: "yield-maximizer",
    agentId: "axiom-agent-yield-001",
    agentName: "Yield Maximizer Agent",
    ownerWallet: "system",
    strategies: ["Jupiter Lend (70%)", "High Conviction Trades", "Auto Harvest"],
  },
];

// GET /api/agents — return all vault agent identities
export async function GET() {
  const agents = await Promise.all(
    VAULT_AGENTS.map(async (v) => {
      const agent = await vaultAgentIdentityStore.getAgentIdentity(v.vaultId);
      return agent ?? { ...v, reputation: 50, wallet: v.ownerWallet, createdAt: Date.now() };
    })
  );
  return NextResponse.json({ agents });
}

// POST /api/agents — seed all vault agents (idempotent)
export async function POST() {
  const results = await Promise.all(
    VAULT_AGENTS.map((v) => vaultAgentIdentityStore.upsertAgentIdentity(v))
  );
  return NextResponse.json({ seeded: results.filter(Boolean).length });
}
