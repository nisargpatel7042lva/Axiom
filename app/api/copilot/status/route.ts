import { copilotRequest, isCopilotConfigured } from "@/lib/copilot/server";

import { NextResponse } from "next/server";

export async function GET() {
  if (!isCopilotConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        authenticated: false,
        message:
          "Set COLOSSEUM_COPILOT_PAT (and optionally COLOSSEUM_COPILOT_API_BASE) in .env.local",
      },
      { status: 200 },
    );
  }

  const res = await copilotRequest("/status", { method: "GET" });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({ configured: true, ...(data as object) });
}
