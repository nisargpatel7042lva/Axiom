"use client";

import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "flowr-copilot-context";

export const DEFAULT_FLOWR_CONTEXT = `Flowr — Solana concentrated liquidity with intent-based rebalancing across Kamino & Meteora pools. Users deploy once, stay in range, and route yield with risk-aware rebalancing and treasury tooling. Evaluate this product against hackathon precedents and archive literature.`;

type ChatMsg =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      ok: boolean;
      errorText?: string;
      partialFailure?: boolean;
      projects: unknown;
      archives: unknown;
    };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function ProjectHits({ data }: { data: unknown }) {
  if (!isRecord(data)) return null;
  if (typeof data.error === "string") {
    return (
      <p className="text-sm text-amber-200/90">
        Projects search: {data.error}
        {typeof data.code === "string" ? ` (${data.code})` : ""}
      </p>
    );
  }
  const results = data.results;
  if (!Array.isArray(results) || results.length === 0) {
    return (
      <p className="text-sm text-[#8b9cb3]">No similar hackathon projects found.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {results.slice(0, 12).map((raw, i) => {
        if (!isRecord(raw)) return null;
        const name = typeof raw.name === "string" ? raw.name : "Project";
        const slug = typeof raw.slug === "string" ? raw.slug : "";
        const oneLiner =
          typeof raw.oneLiner === "string" ? raw.oneLiner : null;
        const sim = typeof raw.similarity === "number" ? raw.similarity : null;
        const hackathon = isRecord(raw.hackathon)
          ? typeof raw.hackathon.name === "string"
            ? raw.hackathon.name
            : ""
          : "";
        const links = isRecord(raw.links) ? raw.links : null;
        const colosseum =
          links && typeof links.colosseum === "string" ? links.colosseum : null;
        const github =
          links && typeof links.github === "string" ? links.github : null;

        return (
          <li
            key={slug || String(i)}
            className="rounded-lg border border-white/10 bg-[#0d1420] p-3 text-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-[#e8edf5]">{name}</span>
              {sim != null && (
                <span className="font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
                  score {sim.toFixed(3)}
                </span>
              )}
            </div>
            {hackathon && (
              <div className="mt-1 text-xs text-[#00e5c3]/90">{hackathon}</div>
            )}
            {oneLiner && (
              <p className="mt-2 text-[#c5d0dc] leading-relaxed">{oneLiner}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {colosseum && (
                <a
                  href={colosseum}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00e5c3] underline hover:text-[#33ebd3]"
                >
                  Colosseum
                </a>
              )}
              {github && (
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8b9cb3] underline hover:text-[#e8edf5]"
                >
                  GitHub
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ArchiveHits({ data }: { data: unknown }) {
  if (!isRecord(data)) return null;
  if (typeof data.error === "string") {
    return (
      <p className="text-sm text-amber-200/90">
        Archive search: {data.error}
        {typeof data.code === "string" ? ` (${data.code})` : ""}
      </p>
    );
  }
  const results = data.results;
  if (!Array.isArray(results) || results.length === 0) {
    return (
      <p className="text-sm text-[#8b9cb3]">No archive documents matched.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {results.map((raw, i) => {
        if (!isRecord(raw)) return null;
        const title = typeof raw.title === "string" ? raw.title : "Document";
        const snippet = typeof raw.snippet === "string" ? raw.snippet : "";
        const source = typeof raw.source === "string" ? raw.source : "";
        const url = typeof raw.url === "string" ? raw.url : null;
        const sim = typeof raw.similarity === "number" ? raw.similarity : null;

        return (
          <li
            key={typeof raw.documentId === "string" ? raw.documentId : i}
            className="rounded-lg border border-white/10 bg-[#0d1420] p-3 text-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-[#e8edf5]">{title}</span>
              {sim != null && (
                <span className="font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
                  {sim.toFixed(3)}
                </span>
              )}
            </div>
            {source && (
              <div className="mt-1 text-xs uppercase tracking-wide text-[#8b9cb3]">
                {source}
              </div>
            )}
            <p className="mt-2 whitespace-pre-wrap text-[#c5d0dc] leading-relaxed">
              {snippet}
            </p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-[#00e5c3] underline hover:text-[#33ebd3]"
              >
                Source
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function CopilotResearchWorkspace() {
  const [projectContext, setProjectContext] = useState(DEFAULT_FLOWR_CONTEXT);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProjectContext(saved);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, projectContext);
    } catch {
      /* ignore */
    }
  }, [projectContext, hydrated]);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/copilot/status");
      const data = (await res.json()) as {
        configured?: boolean;
        authenticated?: boolean;
        expiresAt?: string;
        message?: string;
      };
      if (data.configured === false) {
        setStatusLine(data.message ?? "Copilot PAT not configured");
        return;
      }
      if (data.authenticated) {
        setStatusLine(
          data.expiresAt
            ? `Connected · token expires ${data.expiresAt}`
            : "Connected to Colosseum Copilot",
        );
      } else {
        setStatusLine("Token check failed — verify COLOSSEUM_COPILOT_PAT");
      }
    } catch {
      setStatusLine("Could not reach /api/copilot/status");
    }
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/copilot/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          projectContext: projectContext.trim() || undefined,
        }),
      });

      const payload = (await res.json()) as {
        error?: string;
        projects?: unknown;
        archives?: unknown;
        partialFailure?: boolean;
      };

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            ok: false,
            errorText: payload.error ?? `Request failed (${res.status})`,
            projects: payload.projects ?? null,
            archives: payload.archives ?? null,
          },
        ]);
        return;
      }

      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          ok: true,
          partialFailure: payload.partialFailure,
          projects: payload.projects ?? null,
          archives: payload.archives ?? null,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          ok: false,
          errorText: e instanceof Error ? e.message : "Network error",
          projects: null,
          archives: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-[#0a0f18]">
        <div className="border-b border-white/5 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#e8edf5]">
            Your project (Flowr)
          </h2>
          <p className="mt-1 text-xs text-[#8b9cb3]">
            Edit this brief — it is combined with each question for Copilot
            project search so you can compare side by side with ecosystem
            results.
          </p>
        </div>
        <textarea
          value={projectContext}
          onChange={(e) => setProjectContext(e.target.value)}
          spellCheck
          className="min-h-[240px] flex-1 resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-[#e8edf5] placeholder:text-[#5a6b7d] focus:outline-none lg:min-h-[320px]"
          placeholder="Describe Flowr for comparison…"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {statusLine && (
          <p className="text-xs text-[#8b9cb3]">{statusLine}</p>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0f18]">
          <div className="border-b border-white/5 px-4 py-3">
            <h3 className="text-sm font-semibold text-[#e8edf5]">
              Colosseum Copilot
            </h3>
            <p className="mt-1 text-xs text-[#8b9cb3]">
              Each message runs parallel searches: hackathon projects + archive
              (same API as the Claude Code skill).
            </p>
          </div>

          <div className="min-h-[280px] flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className="text-sm text-[#8b9cb3]">
                Ask about competitors, gaps, precedents, or who else shipped
                similar ideas — results cite Colosseum projects and archive
                sources.
              </p>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[95%] rounded-2xl rounded-br-md bg-[#00e5c3]/15 px-4 py-2 text-sm text-[#e8edf5]">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="space-y-4">
                      {!msg.ok && (
                        <div
                          role="alert"
                          className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]"
                        >
                          {msg.errorText ?? "Unknown error"}
                        </div>
                      )}
                      {msg.partialFailure && msg.ok && (
                        <p className="text-xs text-amber-200/90">
                          Partial result: one Copilot endpoint returned an error;
                          check sections below.
                        </p>
                      )}
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#00e5c3]">
                          Hackathon projects
                        </h4>
                        <ProjectHits data={msg.projects} />
                      </div>
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#00e5c3]">
                          Archive & literature
                        </h4>
                        <ArchiveHits data={msg.archives} />
                      </div>
                    </div>
                  ),
                )}
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-[#8b9cb3]">
                    <Loader2 className="size-4 animate-spin" />
                    Querying Colosseum…
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-white/5 p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                placeholder="e.g. Who else built intent-based LP tooling on Solana?"
                className="min-h-[44px] flex-1 resize-y rounded-lg border border-white/10 bg-[#080c14] px-3 py-2 text-sm text-[#e8edf5] placeholder:text-[#5a6b7d] focus:border-[#00e5c3]/50 focus:outline-none focus:ring-1 focus:ring-[#00e5c3]/30"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-end rounded-lg bg-[#00e5c3] px-4 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3] disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
