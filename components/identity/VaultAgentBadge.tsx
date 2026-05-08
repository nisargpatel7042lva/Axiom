"use client";

import { Brain, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useVaultAgentIdentity } from "@/hooks/useVaultAgentIdentity";

const FALLBACK: Record<string, { agentName: string; reputation: number }> = {
  "safe-consensus":   { agentName: "Safe Consensus Agent",  reputation: 82 },
  "macro-contrarian": { agentName: "Macro Contrarian Agent", reputation: 67 },
  "yield-maximizer":  { agentName: "Yield Maximizer Agent",  reputation: 74 },
};

function reputationColor(score: number) {
  if (score >= 75) return { dot: "#00e5c3", text: "text-[#00e5c3]", bg: "bg-[#00e5c3]/10" };
  if (score >= 50) return { dot: "#a78bfa", text: "text-[#a78bfa]", bg: "bg-[#8b5cf6]/10" };
  return { dot: "#fbbf24", text: "text-[#fbbf24]", bg: "bg-[#f59e0b]/10" };
}

export function VaultAgentBadge({ vaultId }: { vaultId: string }) {
  const { agent } = useVaultAgentIdentity(vaultId);
  const display = agent ?? FALLBACK[vaultId];
  if (!display) return null;

  const { dot, text, bg } = reputationColor(display.reputation);

  return (
    <Link
      href="/identity"
      onClick={(e) => e.stopPropagation()}
      className={`mt-4 flex items-center justify-between gap-2 rounded-lg border border-white/5 ${bg} px-3 py-2 transition-colors hover:border-white/10`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Brain className="size-3.5 shrink-0 text-[#8b9cb3]" />
        <span className="truncate text-[11px] text-[#8b9cb3]">{display.agentName}</span>
      </div>
      <div className={`flex items-center gap-1 shrink-0 text-[11px] font-semibold ${text}`}>
        <TrendingUp className="size-3" />
        <span>{Math.round(display.reputation)}</span>
        <span
          className="inline-block size-1.5 rounded-full"
          style={{ backgroundColor: dot }}
        />
      </div>
    </Link>
  );
}
