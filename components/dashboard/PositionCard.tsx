"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

import { formatPercent, formatUsd } from "@/components/format";

import type { LPPosition } from "@/types/index";
import Decimal from "decimal.js";

function shortAddr(s: string, chars = 4): string {
  if (s.length <= chars * 2) return s;
  return `${s.slice(0, chars)}…${s.slice(-chars)}`;
}

function frsTotal(m: LPPosition["metrics"]): number {
  return m.rangeProximityScore
    .plus(m.ilVelocityScore)
    .plus(m.feeCaptureScore)
    .div(3)
    .toNumber();
}

function rangePill(status: LPPosition["status"]): { label: string; className: string } {
  if (status === "healthy")
    return {
      label: "In range",
      className: "bg-[#00e5c3]/15 text-[#00e5c3]",
    };
  if (status === "warning")
    return {
      label: "At risk",
      className: "bg-amber-500/15 text-amber-300",
    };
  return {
    label: "Out of range",
    className: "bg-[#ef4444]/15 text-[#ef4444]",
  };
}

function frsColor(score: number): string {
  if (score >= 70) return "text-[#00e5c3]";
  if (score >= 40) return "text-amber-300";
  return "text-[#ef4444]";
}

function protocolBadge(protocol: LPPosition["protocol"]) {
  const label = protocol === "kamino" ? "KAMINO" : "METEORA";
  const cls =
    protocol === "kamino"
      ? "bg-violet-500/20 text-violet-200"
      : "bg-cyan-500/20 text-cyan-200";
  return (
    <span
      className={`rounded px-2 py-0.5 font-[family-name:var(--font-space-mono)] text-[10px] font-bold ${cls}`}
    >
      {label}
    </span>
  );
}

export function PositionCard({
  position,
  onFixIt,
  isExpanded,
  onToggleExpand,
  currentPrice,
}: {
  position: LPPosition;
  onFixIt: (p: LPPosition) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  /** Human price for token A in terms of B (e.g. SOL in USDC). */
  currentPrice: number | null;
}) {
  const score = frsTotal(position.metrics);
  const pill = rangePill(position.status);
  const pairName = `${position.tokenA.symbol}/${position.tokenB.symbol}`;

  const feesUsd = useMemo(() => {
    return position.metrics.tvlUsd.mul(position.metrics.feeCaptureScore).div(400);
  }, [position.metrics]);

  const ilUsd = useMemo(() => {
    return position.metrics.tvlUsd.mul(new Decimal(100).minus(position.metrics.ilVelocityScore)).div(500).neg();
  }, [position.metrics]);

  const netPnl = useMemo(() => {
    return feesUsd.plus(ilUsd);
  }, [feesUsd, ilUsd]);

  const range = position.range;
  const lower = range?.lower.toNumber() ?? 0;
  const upper = range?.upper.toNumber() ?? 1;
  const price = currentPrice ?? (lower + upper) / 2;
  const span = Math.max(upper - lower, 1e-9);
  const thumbPct = Math.min(
    100,
    Math.max(0, ((price - lower) / span) * 100),
  );

  const suggestedLower = range ? range.lower.mul(0.97) : new Decimal(0);
  const suggestedUpper = range ? range.upper.mul(1.03) : new Decimal(0);

  const ageDays = useMemo(() => {
    const t = Date.now() - new Date(position.updatedAt).getTime();
    return Math.max(0, Math.round(t / 86400000));
  }, [position.updatedAt]);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d1420]">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex -space-x-2">
              <TokenIcon token={position.tokenA} />
              <TokenIcon token={position.tokenB} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-[family-name:var(--font-space-mono)] text-base font-bold text-[#e8edf5]">
                  {pairName}
                </h3>
                {protocolBadge(position.protocol)}
                <span
                  className={`rounded-full px-2 py-0.5 font-[family-name:var(--font-space-mono)] text-[10px] font-semibold uppercase ${pill.className}`}
                >
                  {pill.label}
                </span>
              </div>
              <p className="mt-0.5 font-[family-name:var(--font-space-mono)] text-[11px] text-[#8b9cb3]">
                {shortAddr(position.poolOrMarketAddress)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase text-[#8b9cb3]">FRS</div>
              <div
                className={`font-[family-name:var(--font-space-mono)] text-3xl font-bold leading-none ${frsColor(score)}`}
              >
                {Math.round(score)}
              </div>
              <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-[#1a2332]">
                <div
                  className="h-full rounded-full bg-[#00e5c3]"
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
            </div>
            {score < 40 && (
              <button
                type="button"
                onClick={() => onFixIt(position)}
                className="relative flex items-center gap-2 rounded-lg bg-[#ef4444]/15 px-3 py-2 text-xs font-bold text-[#ef4444] ring-1 ring-[#ef4444]/40 hover:bg-[#ef4444]/25"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef4444] opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#ef4444]" />
                </span>
                Fix it
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="TVL" value={formatUsd(position.metrics.tvlUsd)} />
          <Metric label="Fees" value={formatUsd(feesUsd)} accent="text-[#00e5c3]" />
          <Metric label="IL" value={formatUsd(ilUsd)} accent="text-[#ef4444]" />
          <Metric
            label={"Net P&L"}
            value={formatUsd(netPnl)}
            accent={netPnl.gte(0) ? "text-[#00e5c3]" : "text-[#ef4444]"}
          />
        </div>

        {range && (
          <div className="mt-6">
            <div className="mb-1 flex justify-between font-[family-name:var(--font-space-mono)] text-[10px] text-[#8b9cb3]">
              <span>{lower.toFixed(4)}</span>
              <span>Spot {price.toFixed(4)}</span>
              <span>{upper.toFixed(4)}</span>
            </div>
            <div className="relative h-3 rounded-full bg-[#1a2332]">
              <div
                className="absolute inset-y-1 left-[2%] right-[2%] rounded-full bg-gradient-to-r from-sky-500/30 to-[#00e5c3]/30"
              />
              <div
                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#00e5c3] bg-[#080c14]"
                style={{ left: `${2 + thumbPct * 0.96}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleExpand}
          className="mt-4 flex w-full items-center justify-center gap-1 text-xs font-medium text-[#8b9cb3] hover:text-[#e8edf5]"
        >
          {isExpanded ? "Hide details" : "Show details"}
          <ChevronDown
            className={`size-4 transition ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-white/5 bg-[#080c14]/50 px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="Volume" value={formatUsd(position.metrics.tvlUsd.mul(12))} />
            <MiniStat
              label="APR"
              value={formatPercent(position.metrics.estimatedAprPercent)}
            />
            <MiniStat
              label="IL velocity"
              value={formatPercent(position.metrics.ilVelocityScore)}
            />
            <MiniStat label="Age" value={`${ageDays}d`} />
            <MiniStat
              label="Range"
              value={
                range
                  ? `${range.lower.toFixed(2)} – ${range.upper.toFixed(2)}`
                  : "—"
              }
            />
            <MiniStat
              label="Suggested range"
              value={
                range
                  ? `${suggestedLower.toFixed(2)} – ${suggestedUpper.toFixed(2)}`
                  : "—"
              }
            />
          </div>
        </div>
      )}
    </article>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-[#080c14]/80 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-[#8b9cb3]">
        {label}
      </div>
      <div
        className={`font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5] ${accent ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 p-3">
      <div className="text-[10px] uppercase text-[#8b9cb3]">{label}</div>
      <div className="font-[family-name:var(--font-space-mono)] mt-1 text-sm text-[#e8edf5]">
        {value}
      </div>
    </div>
  );
}

function TokenIcon({ token }: { token: LPPosition["tokenA"] }) {
  if (token.logoUri) {
    return (
      <div className="relative size-9 overflow-hidden rounded-full border border-white/10 bg-[#1a2332]">
        <Image
          src={token.logoUri}
          alt={token.symbol}
          width={36}
          height={36}
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-[#1a2332] font-[family-name:var(--font-space-mono)] text-[10px] font-bold text-[#e8edf5]">
      {token.symbol.slice(0, 2)}
    </div>
  );
}
