"use client";

import { formatUsd } from "@/components/format";
import { Skeleton } from "@/components/ui/Skeleton";

import Decimal from "decimal.js";

export type SummaryFigures = {
  deployedCapital: Decimal;
  netYield: Decimal;
  feesEarned: Decimal;
  impermanentLoss: Decimal;
};

const cards: {
  key: keyof SummaryFigures;
  label: string;
  accent: string;
  valueClass?: string;
}[] = [
  {
    key: "deployedCapital",
    label: "Deployed Capital",
    accent: "border-t-[#00e5c3]",
  },
  {
    key: "netYield",
    label: "Net Yield",
    accent: "border-t-emerald-400",
    valueClass: "text-[#00e5c3]",
  },
  {
    key: "feesEarned",
    label: "Fees Earned",
    accent: "border-t-cyan-400",
    valueClass: "text-[#00e5c3]",
  },
  {
    key: "impermanentLoss",
    label: "Impermanent Loss",
    accent: "border-t-[#ef4444]",
    valueClass: "text-[#ef4444]",
  },
];

export function SummaryCards({
  figures,
  isLoading,
}: {
  figures: SummaryFigures | null;
  isLoading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, accent, valueClass }) => (
        <div
          key={key}
          className={`rounded-xl border border-white/5 bg-[#0d1420] ${accent} border-t-4 p-5 shadow-lg shadow-black/20`}
        >
          <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
            {label}
          </div>
          {isLoading || !figures ? (
            <Skeleton className="mt-3 h-9 w-36" />
          ) : (
            <div
              className={`mt-3 font-[family-name:var(--font-space-mono)] text-2xl font-bold text-[#e8edf5] ${valueClass ?? ""}`}
            >
              {formatUsd(figures[key])}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
