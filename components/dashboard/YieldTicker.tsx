"use client";

import Decimal from "decimal.js";
import { useEffect, useMemo, useState } from "react";

import { formatFeesTicker } from "@/components/format";

import type { LPPosition } from "@/types/index";

function weightedAvgFeeApr(positions: LPPosition[]): number {
  let num = new Decimal(0);
  let den = new Decimal(0);
  for (const p of positions) {
    if (p.status !== "healthy") continue;
    const w = p.metrics.tvlUsd;
    num = num.plus(p.metrics.estimatedAprPercent.mul(w));
    den = den.plus(w);
  }
  if (den.isZero()) return 0;
  return num.div(den).toNumber();
}

export function YieldTicker({
  positions,
  deployedCapital,
}: {
  positions: LPPosition[];
  deployedCapital: Decimal;
}) {
  const inRange = positions.filter((p) => p.status === "healthy");
  const avgFeeApr = useMemo(() => weightedAvgFeeApr(inRange), [inRange]);

  const yieldPerSecond = useMemo(() => {
    if (inRange.length === 0) return 0;
    return deployedCapital.mul(avgFeeApr).div(100).div(31_536_000).toNumber();
  }, [deployedCapital, avgFeeApr, inRange.length]);

  const [accumulated, setAccumulated] = useState(0);

  useEffect(() => {
    if (inRange.length === 0) {
      setAccumulated(0);
      return;
    }
    setAccumulated(0);
    const id = window.setInterval(() => {
      setAccumulated((a) => a + yieldPerSecond);
    }, 1000);
    return () => window.clearInterval(id);
  }, [yieldPerSecond, inRange.length]);

  const display = inRange.length === 0 ? 0 : accumulated;

  return (
    <div className="rounded-2xl border border-[#00e5c3]/20 bg-[#0d1420] px-6 py-8 text-center">
      <div className="font-[family-name:var(--font-space-mono)] text-4xl font-bold tracking-tight text-[#00e5c3] md:text-5xl">
        {inRange.length === 0 ? (
          <span className="text-[#8b9cb3]">—</span>
        ) : (
          formatFeesTicker(display)
        )}
      </div>
      <p className="mt-2 text-sm text-[#8b9cb3]">
        Fees earned since deposit (live estimate)
      </p>
      {inRange.length === 0 && (
        <p className="mt-1 text-xs text-[#8b9cb3]">
          Ticker runs when at least one position is in range.
        </p>
      )}
    </div>
  );
}
