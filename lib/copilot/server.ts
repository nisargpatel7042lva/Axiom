/**
 * Server-only Colosseum Copilot API client.
 * @see https://docs.colosseum.com/copilot/api-reference
 */

function getBaseUrl(): string {
  return (
    process.env.COLOSSEUM_COPILOT_API_BASE?.replace(/\/$/, "") ??
    "https://copilot.colosseum.com/api/v1"
  );
}

function getPat(): string | undefined {
  const v = process.env.COLOSSEUM_COPILOT_PAT;
  return v && v.length > 0 ? v : undefined;
}

export function isCopilotConfigured(): boolean {
  return getPat() !== undefined;
}

export async function copilotRequest(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const pat = getPat();
  if (!pat) {
    return new Response(
      JSON.stringify({
        error: "Colosseum Copilot is not configured. Set COLOSSEUM_COPILOT_PAT in the server environment.",
        code: "NOT_CONFIGURED",
        retryable: false,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${pat}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers });
}
