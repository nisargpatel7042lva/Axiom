import { NextResponse } from "next/server";

const DUNE_BASE = "https://api.sim.dune.com";

function getKey() {
  return process.env.DUNE_SIM_API_KEY ?? process.env.NEXT_PUBLIC_DUNE_SIM_API_KEY ?? "";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const limit = searchParams.get("limit") ?? "20";

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const key = getKey();
  if (!key) {
    return NextResponse.json({ transactions: [] });
  }

  const upstream = await fetch(
    `${DUNE_BASE}/beta/svm/transactions/${encodeURIComponent(address)}?limit=${limit}&chains=solana`,
    { headers: { "X-Sim-Api-Key": key }, next: { revalidate: 15 } },
  );

  if (!upstream.ok) {
    return NextResponse.json({ transactions: [] }, { status: upstream.status });
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
