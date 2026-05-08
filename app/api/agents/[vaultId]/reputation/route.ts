import { NextResponse } from "next/server";
import { vaultAgentIdentityStore } from "@/lib/services/vault-agent-identity";

// POST /api/agents/:vaultId/reputation
// Body: { performanceScore: number } — 0-100, called by the engine after each NAV cycle
export async function POST(
  req: Request,
  { params }: { params: Promise<{ vaultId: string }> }
) {
  const { vaultId } = await params;
  const body = await req.json().catch(() => ({}));
  const score = typeof body.performanceScore === "number" ? body.performanceScore : null;

  if (score === null || score < 0 || score > 100) {
    return NextResponse.json({ error: "performanceScore must be 0–100" }, { status: 400 });
  }

  const updated = await vaultAgentIdentityStore.updateAgentReputation(vaultId, score);
  if (!updated) {
    return NextResponse.json({ error: "Agent not found or Supabase unavailable" }, { status: 404 });
  }

  return NextResponse.json({ vaultId, reputation: updated.reputation });
}

// GET /api/agents/:vaultId/reputation
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vaultId: string }> }
) {
  const { vaultId } = await params;
  const agent = await vaultAgentIdentityStore.getAgentIdentity(vaultId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json({ vaultId, reputation: agent.reputation, agentName: agent.agentName });
}
