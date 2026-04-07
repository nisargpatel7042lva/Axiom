import { copilotRequest, isCopilotConfigured } from "@/lib/copilot/server";

import { NextResponse } from "next/server";

const MAX_QUERY = 500;
const DEFAULT_PROJECT_LIMIT = 10;
const DEFAULT_ARCHIVE_LIMIT = 5;

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export async function POST(req: Request) {
  if (!isCopilotConfigured()) {
    return NextResponse.json(
      {
        error:
          "Colosseum Copilot is not configured. Add COLOSSEUM_COPILOT_PAT to .env.local",
        code: "NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  let body: { query?: string; projectContext?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const rawQuery = typeof body.query === "string" ? body.query : "";
  const projectContext =
    typeof body.projectContext === "string" ? body.projectContext.trim() : "";

  if (!rawQuery.trim()) {
    return NextResponse.json(
      { error: "query is required", code: "INVALID_QUERY" },
      { status: 400 },
    );
  }

  const userPart = truncate(rawQuery, MAX_QUERY);
  let combined = userPart;
  if (projectContext) {
    const ctx = truncate(projectContext, Math.floor(MAX_QUERY * 0.55));
    combined = truncate(`${ctx}\n\nQuestion: ${userPart}`, MAX_QUERY);
  }

  const projectsBody = JSON.stringify({
    query: combined,
    limit: DEFAULT_PROJECT_LIMIT,
    diversify: true,
    filters: {},
  });

  const archivesBody = JSON.stringify({
    query: truncate(userPart, MAX_QUERY),
    limit: DEFAULT_ARCHIVE_LIMIT,
    maxChunksPerDoc: 2,
    intent: "docs",
    minSimilarity: 0.2,
  });

  const [projectsRes, archivesRes] = await Promise.all([
    copilotRequest("/search/projects", {
      method: "POST",
      body: projectsBody,
    }),
    copilotRequest("/search/archives", {
      method: "POST",
      body: archivesBody,
    }),
  ]);

  const projectsText = await projectsRes.text();
  const archivesText = await archivesRes.text();

  let projectsJson: unknown;
  let archivesJson: unknown;
  try {
    projectsJson = JSON.parse(projectsText);
  } catch {
    projectsJson = { error: "Invalid JSON from Copilot", raw: projectsText };
  }
  try {
    archivesJson = JSON.parse(archivesText);
  } catch {
    archivesJson = { error: "Invalid JSON from Copilot", raw: archivesText };
  }

  const projectsOk = projectsRes.ok;
  const archivesOk = archivesRes.ok;

  if (!projectsOk && !archivesOk) {
    const status = projectsRes.status >= 500 ? projectsRes.status : archivesRes.status;
    return NextResponse.json(
      {
        error: "Copilot search failed",
        projects: projectsJson,
        archives: archivesJson,
      },
      { status: status >= 400 ? status : 502 },
    );
  }

  return NextResponse.json({
    queryUsed: combined,
    projects: projectsJson,
    archives: archivesJson,
    partialFailure: !projectsOk || !archivesOk,
  });
}
