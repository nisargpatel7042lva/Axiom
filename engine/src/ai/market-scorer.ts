import { CONFIG } from "../config.js";
import { createLogger } from "../utils/logger.js";
import type {
  PredictionEvent,
  PredictionMarket,
  ScoredOpportunity,
  ScoredOpportunityAiMeta,
  VaultStrategyType,
} from "../types/index.js";
import { buildBatchUserPrompt, strategySystemPrompt } from "./prompts.js";
import { getCachedScore, setCachedScore } from "./cache.js";
import type { LlmMarketScore, MarketScoreBatchItem } from "./types.js";
import { passesAiGate } from "./types.js";

const log = createLogger("ai-scorer");

const AI_TIMEOUT_MS = 10_000;
const BATCH_SIZE = Math.max(1, CONFIG.AI_BATCH_SIZE);
const TOP_CANDIDATES = 25;
const BATCH_DELAY_MS = Math.max(0, CONFIG.AI_BATCH_DELAY_MS);

class HourlyRateLimiter {
  private readonly timestamps: number[] = [];
  constructor(private readonly maxPerHour: number) {}

  tryAcquire(): boolean {
    const now = Date.now();
    const windowStart = now - 60 * 60 * 1000;
    while (this.timestamps.length > 0 && this.timestamps[0]! < windowStart) {
      this.timestamps.shift();
    }
    if (this.timestamps.length >= this.maxPerHour) return false;
    this.timestamps.push(now);
    return true;
  }
}

const rateLimiter = new HourlyRateLimiter(CONFIG.AI_MAX_CALLS_PER_HOUR);

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: err.cause,
    };
  }
  if (typeof err === "object" && err !== null) return err as Record<string, unknown>;
  return { message: String(err) };
}

function rulesFallback(
  strategyType: VaultStrategyType,
  market: PredictionMarket,
  strategySide: "yes" | "no",
): LlmMarketScore {
  const prob = market.buyYesPriceUsd;
  const distanceFromCrowd = Math.abs(prob - 0.5);

  let conviction = Math.round(prob * 100);
  if (strategyType === "macro-contrarian") {
    // Keep above contrarian gate (>60) for typical 40–65% bands
    conviction = Math.min(95, Math.max(62, Math.round(58 + distanceFromCrowd * 90)));
  } else if (strategyType === "yield-maximizer") {
    conviction = Math.round(prob * 95);
  }

  const resolution_clarity =
    market.status === "active" && market.volumeTotal > 50_000 ? 78 : 65;

  const mispricing_signal =
    strategyType === "macro-contrarian"
      ? Math.max(-50, Math.min(50, Math.round((0.5 - prob) * 80)))
      : 0;

  const recommended_side: LlmMarketScore["recommended_side"] =
    strategySide === "yes" ? "YES" : "NO";

  return {
    marketId: market.id,
    conviction,
    mispricing_signal,
    resolution_clarity,
    reasoning: "Rules-based fallback (LLM unavailable or rate-limited).",
    recommended_side,
    risk_flags: [],
  };
}

function stripJsonFence(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  return t;
}

function parseScoreArray(raw: string, expectedIds: string[]): LlmMarketScore[] | null {
  try {
    const cleaned = stripJsonFence(raw);
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) return null;

    const out: LlmMarketScore[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i] as Record<string, unknown>;
      if (!row || typeof row !== "object") continue;

      const marketId = String(row.marketId ?? expectedIds[i] ?? "");
      const conviction = Number(row.conviction);
      const mispricing_signal = Number(row.mispricing_signal ?? 0);
      const resolution_clarity = Number(row.resolution_clarity);
      const reasoning = String(row.reasoning ?? "");
      const rs = String(row.recommended_side ?? "SKIP").toUpperCase();
      const recommended_side =
        rs === "YES" || rs === "NO" || rs === "SKIP" ? (rs as LlmMarketScore["recommended_side"]) : "SKIP";
      const risk_flags = Array.isArray(row.risk_flags)
        ? row.risk_flags.map((x) => String(x))
        : [];

      if (!marketId || !Number.isFinite(conviction) || !Number.isFinite(resolution_clarity)) continue;

      out.push({
        marketId,
        conviction: Math.max(0, Math.min(100, conviction)),
        mispricing_signal: Math.max(-50, Math.min(50, mispricing_signal)),
        resolution_clarity: Math.max(0, Math.min(100, resolution_clarity)),
        reasoning,
        recommended_side,
        risk_flags,
      });
    }

    if (out.length !== expectedIds.length) {
      log.warn(`LLM returned ${out.length} scores, expected ${expectedIds.length}`);
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: CONFIG.AI_API_KEY });
  const msg = await withTimeout(
    client.messages.create({
      model: CONFIG.AI_MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    }),
    AI_TIMEOUT_MS,
    "Anthropic",
  );
  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block");
  return block.text;
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: CONFIG.AI_API_KEY, timeout: AI_TIMEOUT_MS });
  const completion = await client.chat.completions.create({
    model: CONFIG.AI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: system + '\nReturn JSON: { "scores": [ ...array of score objects... ] }',
      },
      { role: "user", content: user },
    ],
  });
  const text = completion.choices[0]?.message?.content ?? "";
  try {
    const obj = JSON.parse(text) as { scores?: LlmMarketScore[] };
    if (Array.isArray(obj.scores)) return JSON.stringify(obj.scores);
  } catch {
    /* fall through */
  }
  return text;
}

async function callGemini(system: string, user: string): Promise<string> {
  const model = CONFIG.AI_MODEL || "gemini-2.0-flash";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent` +
    `?key=${encodeURIComponent(CONFIG.AI_API_KEY)}`;

  const body = {
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `${system}\n` +
              'Return JSON only. Shape: [ { "marketId": "...", "conviction": number, "mispricing_signal": number, "resolution_clarity": number, "reasoning": "...", "recommended_side": "YES|NO|SKIP", "risk_flags": [] } ]\n\n' +
              user,
          },
        ],
      },
    ],
  };

  const response = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    AI_TIMEOUT_MS,
    "Gemini",
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Gemini request failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

async function scoreBatchLlm(
  strategyType: VaultStrategyType,
  batch: MarketScoreBatchItem[],
): Promise<LlmMarketScore[] | null> {
  if (!CONFIG.AI_API_KEY) return null;
  if (!rateLimiter.tryAcquire()) {
    log.warn("AI rate limit reached (max calls/hour); using rules fallback for batch");
    return null;
  }

  const system = strategySystemPrompt(strategyType);
  const user = buildBatchUserPrompt(strategyType, batch);

  try {
    const raw =
      CONFIG.AI_PROVIDER === "openai"
        ? await callOpenAI(system, user)
        : CONFIG.AI_PROVIDER === "gemini"
          ? await callGemini(system, user)
        : await callAnthropic(system, user);

    const expectedIds = batch.map((b) => b.marketId);
    const parsed = parseScoreArray(raw, expectedIds);
    return parsed;
  } catch (err) {
    log.warn("LLM batch failed", {
      provider: CONFIG.AI_PROVIDER,
      model: CONFIG.AI_MODEL,
      batchSize: batch.length,
      error: serializeError(err),
    });
    return null;
  }
}

function toBatchItem(
  opp: ScoredOpportunity,
  event: PredictionEvent,
  market: PredictionMarket,
): MarketScoreBatchItem {
  return {
    marketId: market.id,
    eventId: event.id,
    title: opp.title,
    description: event.description ?? "",
    category: event.category ?? "",
    buyYesPriceUsd: market.buyYesPriceUsd,
    buyNoPriceUsd: market.buyNoPriceUsd,
    volume24h: market.volume24h,
    volumeTotal: market.volumeTotal,
    daysToResolution: opp.daysToResolution,
    strategySide: opp.side,
  };
}

/**
 * Enriches and filters rule-scored opportunities using the AI layer (or rules fallback).
 */
export async function scoreOpportunitiesWithAi(
  strategyType: VaultStrategyType,
  opportunities: ScoredOpportunity[],
  events: PredictionEvent[],
): Promise<ScoredOpportunity[]> {
  if (!CONFIG.AI_ENABLED) {
    log.info(`[${strategyType}] AI scoring disabled (AI_ENABLED=false); passing through rules-only list`);
    return opportunities;
  }

  const candidates = opportunities.slice(0, TOP_CANDIDATES);
  const enriched: ScoredOpportunity[] = [];

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const slice = candidates.slice(i, i + BATCH_SIZE);
    const batchItems: MarketScoreBatchItem[] = [];
    const metas: Array<{ opp: ScoredOpportunity; market: PredictionMarket; event: PredictionEvent }> = [];

    for (const opp of slice) {
      const event = events.find((e) => e.id === opp.eventId);
      const market = event?.markets?.find((m) => m.id === opp.marketId) ?? null;
      if (!event || !market) continue;

      const cached = getCachedScore(strategyType, market.id, market.buyYesPriceUsd);
      if (cached) {
        const ai: ScoredOpportunityAiMeta = { ...cached.score, source: cached.source };
        if (passesAiGate(strategyType, cached.score, opp.side)) {
          const combined = opp.score * (cached.score.conviction / 100);
          enriched.push({ ...opp, score: combined, ai });
        }
        continue;
      }

      batchItems.push(toBatchItem(opp, event, market));
      metas.push({ opp, market, event });
    }

    if (batchItems.length === 0) continue;

    let scores = await scoreBatchLlm(strategyType, batchItems);

    if (!scores || scores.length < batchItems.length) {
      // Per-item rules fallback
      for (let j = 0; j < batchItems.length; j++) {
        const { opp, market } = metas[j]!;
        const fb = rulesFallback(strategyType, market, opp.side);
        const ai: ScoredOpportunityAiMeta = { ...fb, source: "rules_fallback" };
        setCachedScore(strategyType, market.id, market.buyYesPriceUsd, fb, "rules_fallback");
        if (passesAiGate(strategyType, fb, opp.side)) {
          const combined = opp.score * (fb.conviction / 100);
          enriched.push({ ...opp, score: combined, ai });
        }
      }
      continue;
    }

    // Map scores by marketId
    const byId = new Map(scores.map((s) => [s.marketId, s]));
    for (let j = 0; j < batchItems.length; j++) {
      const meta = metas[j]!;
      const s = byId.get(batchItems[j]!.marketId) ?? scores[j];
      if (!s) continue;

      setCachedScore(strategyType, meta.market.id, meta.market.buyYesPriceUsd, s, "llm");
      const ai: ScoredOpportunityAiMeta = { ...s, source: "llm" };

      if (!passesAiGate(strategyType, s, meta.opp.side)) continue;

      const combined = meta.opp.score * (s.conviction / 100);
      enriched.push({ ...meta.opp, score: combined, ai });
    }

    if (BATCH_DELAY_MS > 0 && i + BATCH_SIZE < candidates.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  enriched.sort((a, b) => b.score - a.score);
  log.info(
    `[${strategyType}] AI filter: ${candidates.length} candidates → ${enriched.length} passed (provider=${CONFIG.AI_PROVIDER})`,
  );
  return enriched;
}
