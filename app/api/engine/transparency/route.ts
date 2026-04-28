import { NextResponse } from "next/server";

const DEFAULT_ENGINE_BASE =
  process.env.ENGINE_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_ENGINE_API_BASE_URL?.trim() ||
  "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${DEFAULT_ENGINE_BASE}/api/transparency`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Engine transparency request failed (${res.status})` },
        { status: 502 },
      );
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Unable to reach engine API: ${message}` },
      { status: 502 },
    );
  }
}

