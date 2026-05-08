"use client";

import { Badge } from "@/components/ui/Badge";
import type { AgentIdentity } from "@/lib/services/sns-identity";
import { Brain, TrendingUp } from "lucide-react";

export function AgentIdentityCard({ agent }: { agent: AgentIdentity }) {
  const reputationColor =
    agent.reputation >= 75
      ? "bg-[#00e5c3]/20 text-[#00e5c3]"
      : agent.reputation >= 50
        ? "bg-[#8b5cf6]/20 text-[#a78bfa]"
        : "bg-[#f59e0b]/20 text-[#fbbf24]";

  return (
    <div className="rounded-lg border border-[#1f2e3d] bg-[#0d1420] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8b5cf6]/20 text-[#a78bfa]">
            <Brain className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[#e8edf5] truncate">
              {agent.agentName}
            </h3>
            <p className="font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3] truncate">
              {agent.agentId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-xs font-medium flex items-center gap-1 ${reputationColor}`}>
          <TrendingUp className="h-3 w-3" />
          {Math.round(agent.reputation)}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[#8b9cb3]">Reputation</span>
          <div className="h-2 w-32 rounded-full bg-[#1f2e3d] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#00e5c3] transition-all"
              style={{ width: `${agent.reputation}%` }}
            />
          </div>
        </div>

        {agent.strategies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.strategies.map((strategy) => (
              <Badge key={strategy} variant="outline" className="text-xs">
                {strategy}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
