"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  TrendingUp,
  Shield,
  Target,
  Gem,
  Radio,
  Info,
} from "lucide-react";
import type { VaultConfig, VaultState } from "@/types";
import { formatUsd, formatUsdCompact, formatShares } from "@/components/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { ExposureVenues } from "@/components/vault/ExposureVenues";

const RISK_BADGE: Record<string, { label: string; className: string }> = {
  low: { label: "Low Risk", className: "bg-[#00e5c3]/15 text-[#00e5c3]" },
  medium: { label: "Medium Risk", className: "bg-[#8b5cf6]/15 text-[#8b5cf6]" },
  high: { label: "High Risk", className: "bg-[#f59e0b]/15 text-[#f59e0b]" },
};

const GRADE_BADGE: Record<string, string> = {
  A: "bg-[#00e5c3]/15 text-[#00e5c3] ring-1 ring-[#00e5c3]/25",
  B: "bg-[#8b5cf6]/15 text-[#a78bfa] ring-1 ring-[#8b5cf6]/25",
  C: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
};

const VAULT_ICONS: Record<string, React.ReactNode> = {
  "safe-consensus": <Shield className="size-5" />,
  "macro-contrarian": <Target className="size-5" />,
  "yield-maximizer": <Gem className="size-5" />,
};

export function VaultCard({
  config,
  state,
  loading,
  online,
}: {
  config: VaultConfig;
  state: VaultState | null;
  loading?: boolean;
  /** Whether the on-chain vault account exists on this cluster. */
  online?: boolean;
}) {
  const risk = RISK_BADGE[config.riskLevel];
  const cap = Math.max(1, config.targetCapacityUsd);
  const fillPct =
    state != null ? Math.min(100, Math.round((state.nav / cap) * 1000) / 10) : 0;

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
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${config.accentColor}20`, color: config.accentColor }}
              >
                {VAULT_ICONS[config.id] ?? <TrendingUp className="size-5" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-[#e8edf5] truncate">
                  {config.name}
                </h3>
                <span className="font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
                  {config.ticker}
                </span>
              </div>
            </div>
            <ArrowUpRight className="size-5 shrink-0 text-[#8b9cb3] transition-all group-hover:text-[#00e5c3] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#8b9cb3] line-clamp-2">
            {config.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${risk.className}`}>
              {risk.label}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold font-[family-name:var(--font-space-mono)] ${GRADE_BADGE[config.riskSheet.grade] ?? "bg-white/10 text-[#8b9cb3]"}`}
              title={config.riskSheet.headline}
            >
              Axiom {config.riskSheet.grade}
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-[#8b9cb3]">
              {config.targetApy.min}–{config.targetApy.max}% Target APY
            </span>
            {online === true && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00e5c3]/10 px-2 py-0.5 text-[10px] font-medium text-[#00e5c3]">
                <Radio className="size-3" />
                Devnet
              </span>
            )}
            {online === false && !loading && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                Not initialized
              </span>
            )}
          </div>

          <div className="mt-5 border-t border-white/5 pt-5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3] mb-2">
              <span>NAV vs target capacity</span>
              <span
                className="inline-flex text-[#8b9cb3]"
                title="NAV is read from on-chain total assets. Target capacity is a communications / risk-budget figure for the product narrative — not necessarily enforced as a hard cap in the demo program."
              >
                <Info className="size-3.5" aria-hidden />
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5]">
                {loading || state == null ? (
                  <Skeleton className="h-5 w-36 bg-white/5" />
                ) : (
                  <>
                    {formatUsdCompact(state.nav)}
                    <span className="text-[#8b9cb3] font-normal"> / </span>
                    {formatUsdCompact(config.targetCapacityUsd)}
                  </>
                )}
              </div>
              {state != null && !loading && (
                <span className="text-[11px] font-medium text-[#8b9cb3]">{fillPct}%</span>
              )}
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[#1a2235]">
              {loading || state == null ? (
                <Skeleton className="h-2 w-full rounded-full bg-white/5" />
              ) : (
                <div
                  className="rounded-full transition-all"
                  style={{
                    width: `${fillPct}%`,
                    backgroundColor: config.accentColor,
                  }}
                />
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-5">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                TVL (NAV)
              </div>
              <div className="mt-1 font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5]">
                {loading || state == null ? (
                  <Skeleton className="h-5 w-16 bg-white/5" />
                ) : (
                  formatUsd(state.nav)
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                PPS
              </div>
              <div
                className="mt-1 font-[family-name:var(--font-space-mono)] text-sm font-semibold"
                style={{ color: config.accentColor }}
              >
                {loading || state == null ? (
                  <Skeleton className="h-5 w-14 bg-white/5" />
                ) : (
                  `$${state.pricePerShare.toFixed(4)}`
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                Share supply
              </div>
              <div className="mt-1 font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5]">
                {loading || state == null ? (
                  <Skeleton className="h-5 w-20 bg-white/5" />
                ) : (
                  formatShares(state.totalShares)
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#8b9cb3] mb-2">
              Target allocation (strategy)
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
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-[#8b9cb3]">
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

          <ExposureVenues venues={config.exposureVenues} accentColor={config.accentColor} />
        </div>
      </div>
    </Link>
  );
}
