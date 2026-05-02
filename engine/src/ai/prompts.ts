import type { VaultStrategyType } from "../types/index.js";

const SYSTEM_BASE = `Return ONLY valid JSON array in input order.
No markdown, no extra text.

Each object MUST have exactly these keys:
- "marketId": string (copy from input)
- "conviction": number 0-100
- "mispricing_signal": number -50 to +50 (0 if neutral)
- "resolution_clarity": number 0-100
- "reasoning": string (max 1 sentence)
- "recommended_side": "YES" | "NO" | "SKIP"
- "risk_flags": string[] (empty array if none)

Set risk_flags for ambiguity, illiquidity, or manipulation risk.`;

export function strategySystemPrompt(strategyType: VaultStrategyType): string {
  const persona =
    strategyType === "safe-consensus"
      ? `SAFE CONSENSUS vault persona:
You are a conservative prediction market analyst. This vault only takes high-conviction, near-certain positions.
Score harshly — only recommend markets where the outcome is almost guaranteed and the market is liquid enough to exit.
Flag any ambiguity in resolution criteria.
Use recommended_side "SKIP" unless you would comfortably allocate capital at scale.`
      : strategyType === "macro-contrarian"
        ? `MACRO CONTRARIAN vault persona:
You are a contrarian macro analyst. This vault profits from mispriced political and economic events.
Look for markets where the crowd may be wrong — base rates, historical precedent, or structural factors suggesting true probability differs from market price by >10%.
Be specific in reasoning about WHY it may be mispriced.
Use "SKIP" when the edge is unclear or risk_flags would be long.`
        : `YIELD MAXIMIZER vault persona:
You are a risk-adjusted yield optimizer. This vault wants high probability (>75% implied where relevant), prefers quick resolution (<14 days when possible), and needs enough volume to enter and exit cleanly.
The goal is consistent small wins, not home runs.
Use "SKIP" for exotic, illiquid, or ambiguous-resolution markets.`;

  return `${SYSTEM_BASE}\n\n${persona}`;
}

export function buildBatchUserPrompt(
  strategyType: VaultStrategyType,
  items: Array<{
    marketId: string;
    title: string;
    description: string;
    category: string;
    buyYesPriceUsd: number;
    buyNoPriceUsd: number;
    volume24h: number;
    volumeTotal: number;
    daysToResolution: number;
    strategySide: "yes" | "no";
  }>,
): string {
  const lines = items.map(
    (m, i) =>
      `${i + 1}. marketId=${m.marketId}
   title: ${m.title}
   description: ${m.description?.slice(0, 240) ?? ""}
   category: ${m.category}
   buyYesPriceUsd: ${m.buyYesPriceUsd}
   buyNoPriceUsd: ${m.buyNoPriceUsd}
   volume24h: ${m.volume24h}
   volumeTotal: ${m.volumeTotal}
   daysToResolution: ${m.daysToResolution}
   strategy_preliminary_side: ${m.strategySide.toUpperCase()} (from rules engine — you may agree or recommend SKIP)`,
  );

  return `Vault strategy: ${strategyType}

Markets to score (return JSON array of ${items.length} objects in this exact order):

${lines.join("\n\n")}`;
}
