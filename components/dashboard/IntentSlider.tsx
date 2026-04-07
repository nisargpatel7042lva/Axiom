"use client";

import Decimal from "decimal.js";
import { useMemo, useState } from "react";

import { formatPercent, formatUsd } from "@/components/format";

import type { IntentMode } from "@/types/index";

const STABLE_APR = 6.5;
const GROWTH_APR = 22.4;

function aprForIntent(mode: IntentMode, slider: number): number {
  const t = slider / 100;
  if (mode === "stable") {
    return STABLE_APR + (GROWTH_APR - STABLE_APR) * t * 0.35;
  }
  return GROWTH_APR - (GROWTH_APR - STABLE_APR) * (1 - t) * 0.35;
}

export function IntentSlider({
  usdcBalance,
  onDeploy,
  disabled,
}: {
  usdcBalance: Decimal;
  onDeploy: (amount: Decimal, mode: IntentMode) => void;
  disabled?: boolean;
}) {
  const [slider, setSlider] = useState(35);
  const [amountStr, setAmountStr] = useState("500");

  const mode: IntentMode = slider < 50 ? "stable" : "growth";
  const apr = aprForIntent(mode, slider);

  const amount = useMemo(() => {
    try {
      return new Decimal(amountStr || "0");
    } catch {
      return new Decimal(0);
    }
  }, [amountStr]);

  const monthlyUsd = useMemo(() => {
    const annual = amount.mul(apr).div(100);
    return annual.div(12);
  }, [amount, apr]);

  const max = usdcBalance;
  const overMax = amount.gt(max);

  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1420] p-6 md:p-8">
      <h2 className="text-lg font-semibold text-[#e8edf5]">
        Set your intent
      </h2>
      <p className="mt-1 text-sm text-[#8b9cb3]">
        Slide between stable baseline yield and growth-oriented ranges.
      </p>

      <div className="relative mt-8">
        <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wide">
          <span className="text-sky-300">Stable</span>
          <span className="text-[#00e5c3]">Growth</span>
        </div>
        <div className="relative h-3 rounded-full bg-[#1a2332]">
          <div
            className="absolute inset-y-0 left-0 w-1/2 rounded-l-full bg-sky-500/40"
            style={{ width: "50%" }}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/2 rounded-r-full bg-[#00e5c3]/25"
            style={{ width: "50%", left: "50%" }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={slider}
            onChange={(e) => setSlider(Number(e.target.value))}
            className="absolute inset-0 h-3 w-full cursor-pointer opacity-0"
            disabled={disabled}
          />
          <div
            className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#00e5c3] bg-[#080c14] shadow-md"
            style={{ left: `${slider}%` }}
          />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-[#8b9cb3]">
        Earn approximately{" "}
        <span className="font-[family-name:var(--font-space-mono)] font-semibold text-[#00e5c3]">
          {formatPercent(apr)}
        </span>{" "}
        APR ≈{" "}
        <span className="font-[family-name:var(--font-space-mono)] font-semibold text-[#e8edf5]">
          {formatUsd(monthlyUsd)}
        </span>{" "}
        per month on your deposit
      </p>

      <div className="mx-auto mt-6 max-w-md">
        <label className="text-xs uppercase tracking-wider text-[#8b9cb3]">
          Amount (USDC)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="font-[family-name:var(--font-space-mono)] flex-1 rounded-lg border border-white/10 bg-[#080c14] px-3 py-2.5 text-[#e8edf5] outline-none focus:border-[#00e5c3]/50"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setAmountStr(max.toFixed(2))}
            className="rounded-lg border border-white/10 px-3 text-xs font-medium text-[#00e5c3] hover:bg-white/5"
            disabled={disabled}
          >
            Max{" "}
            <span className="font-[family-name:var(--font-space-mono)]">
              {formatUsd(max)}
            </span>
          </button>
        </div>
        {overMax && (
          <p className="mt-2 text-xs text-[#ef4444]">Exceeds USDC balance.</p>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          disabled={disabled || amount.lte(0) || overMax}
          onClick={() => onDeploy(amount, mode)}
          className="rounded-xl bg-[#00e5c3] px-10 py-3 text-sm font-bold text-[#080c14] transition hover:bg-[#33ebd3] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Deploy
        </button>
      </div>
    </section>
  );
}
