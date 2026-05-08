import { type NextRequest, NextResponse } from "next/server";

export interface SimWebhookEvent {
  id: string;
  receivedAt: string;
  walletAddress: string | null;
  chain: string;
  eventType: string;
  txHash: string | null;
  raw: unknown;
}

// In-memory log — resets on cold start. Swap for Supabase in production.
const eventLog: SimWebhookEvent[] = [];
const MAX_EVENTS = 200;

/**
 * POST /api/webhooks/dune-sim
 *
 * Dune SIM webhook receiver. Register this URL in the Dune SIM dashboard
 * (Subscriptions → Webhooks) with the address(es) you want to monitor.
 * Set DUNE_SIM_WEBHOOK_SECRET to the same value as the webhook secret
 * configured in Dune SIM so every push is authenticated.
 *
 * Payload shape (from Dune SIM docs):
 *   { address, chain, type, hash, block_time, ... }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.DUNE_SIM_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      req.headers.get("x-sim-signature") ??
      req.headers.get("x-dune-webhook-secret") ??
      req.headers.get("authorization")?.replace("Bearer ", "");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event: SimWebhookEvent = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    walletAddress:
      (body.address as string) ?? (body.wallet as string) ?? null,
    chain: (body.chain as string) ?? "solana",
    eventType:
      (body.type as string) ??
      (body.event_type as string) ??
      "transaction",
    txHash:
      (body.hash as string) ??
      (body.tx_hash as string) ??
      (body.signature as string) ??
      null,
    raw: body,
  };

  eventLog.unshift(event);
  if (eventLog.length > MAX_EVENTS) eventLog.splice(MAX_EVENTS);

  return NextResponse.json({ ok: true, id: event.id });
}

/**
 * GET /api/webhooks/dune-sim
 * Returns the most recent 50 webhook events (for the Transparency page live feed).
 */
export async function GET() {
  return NextResponse.json({
    events: eventLog.slice(0, 50),
    total: eventLog.length,
    endpoint: "/api/webhooks/dune-sim",
    description:
      "Dune SIM real-time transaction webhook receiver. Register this URL in the Dune SIM dashboard to push on-chain events into Axiom Vaults instantly.",
  });
}
