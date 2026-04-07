"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingUp, Shield, Target, Gem } from "lucide-react";
import type { VaultConfig, VaultState } from "@/types";
import { formatUsd, formatPercent } from "@/components/format";

const RISK_BADGE: Record<string, { label: string; className: string }> = {
  low: { label: "Low Risk", className: "bg-[#00e5c3]/15 text-[#00e5c3]" },
  medium: { label: "Medium Risk", className: "bg-[#8b5cf6]/15 text-[#8b5cf6]" },
  high: { label: "High Risk", className: "bg-[#f59e0b]/15 text-[#f59e0b]" },
};

const VAULT_ICONS: Record<string, React.ReactNode> = {
  "safe-consensus": <Shield className="size-5" />,
  "macro-contrarian": <Target className="size-5" />,
  "yield-maximizer": <Gem className="size-5" />,
};

export function VaultCard({
  config,
  state,
}: {
  config: VaultConfig;
  state: VaultState;
}) {
  const risk = RISK_BADGE[config.riskLevel];

  return (
    <Link href={`/vaults/${config.id}`} className="group block">
      <div
        className="relative overflow-hidden rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6 transition-all duration-300 hover:border-[#00e5c3]/30 hover:glow-accent"
      >
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${config.accentColor}08, transparent 40%)`,
          }}
        />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${config.accentColor}20`, color: config.accentColor }}
              >
                {VAULT_ICONS[config.id] ?? <TrendingUp className="size-5" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#e8edf5]">
                  {config.name}
                </h3>
                <span className="font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
                  {config.ticker}
                </span>
              </div>
            </div>
            <ArrowUpRight className="size-5 text-[#8b9cb3] transition-all group-hover:text-[#00e5c3] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#8b9cb3] line-clamp-2">
            {config.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${risk.className}`}>
              {risk.label}
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-[#8b9cb3]">
              {config.targetApy.min}–{config.targetApy.max}% Target APY
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-5">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                TVL
              </div>
              <div className="mt-1 font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5]">
                {formatUsd(state.nav)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                PPS
              </div>
              <div className="mt-1 font-[family-name:var(--font-space-mono)] text-sm font-semibold" style={{ color: config.accentColor }}>
                ${state.pricePerShare.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                30d Return
              </div>
              <div className={`mt-1 font-[family-name:var(--font-space-mono)] text-sm font-semibold ${
                state.last30dReturn >= 0 ? "text-[#00e5c3]" : "text-[#ef4444]"
              }`}>
                {state.last30dReturn >= 0 ? "+" : ""}
                {formatPercent(state.last30dReturn)}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#8b9cb3] mb-2">
              Allocation
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-[#1a2235]">
              <div
                className="rounded-l-full transition-all"
                style={{
                  width: `${config.allocation.predictions}%`,
                  backgroundColor: config.accentColor,
                }}
              />
              <div
                className="transition-all"
                style={{
                  width: `${config.allocation.lending}%`,
                  backgroundColor: `${config.accentColor}60`,
                }}
              />
              <div
                className="rounded-r-full bg-[#1a2235]"
                style={{ width: `${config.allocation.idle}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[#8b9cb3]">
              <span className="flex items-center gap-1">
                <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: config.accentColor }} />
                Predictions {config.allocation.predictions}%
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: `${config.accentColor}60` }} />
                Lending {config.allocation.lending}%
              </span>
              {config.allocation.idle > 0 && (
                <span className="flex items-center gap-1">
                  <span className="inline-block size-1.5 rounded-full bg-[#1a2235]" />
                  Idle {config.allocation.idle}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
