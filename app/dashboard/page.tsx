"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { usePositions } from "@/components/integrations/usePositions";
import { usePrices } from "@/components/integrations/usePrices";
import { useRebalance } from "@/components/integrations/useRebalance";
import { IntentSlider } from "@/components/dashboard/IntentSlider";
import { PositionCard } from "@/components/dashboard/PositionCard";
import {
  RebalanceModal,
  useRebalancePriorityFee,
} from "@/components/dashboard/RebalanceModal";
import { SummaryCards, type SummaryFigures } from "@/components/dashboard/SummaryCards";
import { YieldTicker } from "@/components/dashboard/YieldTicker";
import { Topbar, type FlowrTopbarTreasury } from "@/components/layout/Topbar";
import { DepositModal } from "@/components/payments/DepositModal";
import { WithdrawYieldModal } from "@/components/payments/WithdrawYieldModal";

import type { LPPosition } from "@/types/index";
import Decimal from "decimal.js";

type ModalKey = "rebalance" | "withdraw" | "deposit" | null;
type FilterTab = "all" | "healthy" | "at-risk";

function spotPrice(
  position: LPPosition,
  prices: Record<string, number>,
  solPrice: number,
): number | null {
  if (position.tokenA.symbol === "SOL")
    return prices[position.tokenA.mint] ?? solPrice;
  if (position.tokenB.symbol === "SOL")
    return prices[position.tokenB.mint] ?? solPrice;
  return null;
}

export default function DashboardPage() {
  const { connected, connecting } = useWallet();
  const router = useRouter();
  const { positions, treasury, isLoading } = usePositions();
  const { prices, solPrice, isLoading: pricesLoading } = usePrices();
  const { state: rebalanceState, plan, execute, reset } = useRebalance();
  const priorityFee = useRebalancePriorityFee(rebalanceState);

  const [expandedCards, setExpandedCards] = useState<Set<string>>(() => new Set());
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [selectedPosition, setSelectedPosition] = useState<LPPosition | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    if (!connecting && !connected) {
      router.replace("/");
    }
  }, [connected, connecting, router]);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const criticalPositions = useMemo(
    () => positions.filter((p) => p.status === "critical"),
    [positions],
  );

  const filteredPositions = useMemo(() => {
    if (filter === "healthy")
      return positions.filter((p) => p.status === "healthy");
    if (filter === "at-risk")
      return positions.filter((p) => p.status !== "healthy");
    return positions;
  }, [positions, filter]);

  const totalTvl = useMemo(
    () =>
      positions.reduce(
        (acc, p) => acc.plus(p.metrics.tvlUsd),
        new Decimal(0),
      ),
    [positions],
  );

  const summaryFigures: SummaryFigures | null = useMemo(() => {
    if (isLoading) return null;
    let feesEarned = new Decimal(0);
    let impermanentLoss = new Decimal(0);
    for (const p of positions) {
      feesEarned = feesEarned.plus(
        p.metrics.tvlUsd.mul(p.metrics.feeCaptureScore).div(400),
      );
      impermanentLoss = impermanentLoss.plus(
        p.metrics
          .tvlUsd.mul(new Decimal(100).minus(p.metrics.ilVelocityScore))
          .div(500)
          .neg(),
      );
    }
    const netYield = treasury.pendingPayoutUsdc.plus(feesEarned).plus(
      impermanentLoss,
    );
    return {
      deployedCapital: totalTvl,
      netYield,
      feesEarned,
      impermanentLoss,
    };
  }, [isLoading, positions, treasury.pendingPayoutUsdc, totalTvl]);

  const headerTreasury: FlowrTopbarTreasury | null = useMemo(() => {
    if (isLoading) return null;
    return {
      ...treasury,
      totalTvlUsd: totalTvl,
      netYieldUsd: summaryFigures?.netYield ?? new Decimal(0),
    };
  }, [isLoading, treasury, totalTvl, summaryFigures?.netYield]);

  const openRebalance = (p: LPPosition) => {
    setSelectedPosition(p);
    setActiveModal("rebalance");
  };

  const closeModal = (m: Exclude<ModalKey, null>) => {
    setActiveModal((cur) => (cur === m ? null : cur));
    if (m === "rebalance") {
      reset();
      setSelectedPosition(null);
    }
  };

  if (!connected) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14]">
        <div className="mx-auto mt-24 w-full max-w-md space-y-4 px-4">
          <div className="h-10 animate-pulse rounded-lg bg-[#1a2332]" />
          <div className="h-48 animate-pulse rounded-2xl bg-[#1a2332]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar
        treasury={headerTreasury}
        activePositionCount={positions.length}
        showResearchLink
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        {criticalPositions.length > 0 && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#fecaca]"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef4444] opacity-50" />
              <span className="relative inline-flex size-2.5 rounded-full bg-[#ef4444]" />
            </span>
            <span>
              {criticalPositions.length} position
              {criticalPositions.length > 1 ? "s" : ""} out of range — rebalance
              to restore fees and lower risk.
            </span>
          </div>
        )}

        <SummaryCards
          figures={summaryFigures}
          isLoading={isLoading || pricesLoading}
        />

        <div className="mt-10">
          <YieldTicker positions={positions} deployedCapital={totalTvl} />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[#e8edf5]">Positions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveModal("deposit")}
              className="rounded-lg bg-[#00e5c3] px-4 py-2 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
            >
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("withdraw")}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-[#e8edf5] hover:bg-white/5"
            >
              Withdraw yield
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 border-b border-white/5 pb-2">
          {(
            [
              ["all", "All"],
              ["healthy", "Healthy"],
              ["at-risk", "At risk"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === key
                  ? "bg-white/10 text-[#00e5c3]"
                  : "text-[#8b9cb3] hover:text-[#e8edf5]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <>
              <div className="h-48 animate-pulse rounded-2xl bg-[#1a2332]" />
              <div className="h-48 animate-pulse rounded-2xl bg-[#1a2332]" />
            </>
          ) : filteredPositions.length === 0 ? (
            positions.length === 0 ? (
              <IntentSlider
                usdcBalance={treasury.usdcBalance}
                onDeploy={() => setActiveModal("deposit")}
              />
            ) : (
              <p className="text-center text-sm text-[#8b9cb3]">
                No positions match this filter.
              </p>
            )
          ) : (
            filteredPositions.map((p) => (
              <PositionCard
                key={p.id}
                position={p}
                onFixIt={openRebalance}
                isExpanded={expandedCards.has(p.id)}
                onToggleExpand={() => toggleExpand(p.id)}
                currentPrice={spotPrice(p, prices, solPrice)}
              />
            ))
          )}
        </div>
      </main>

      <RebalanceModal
        open={activeModal === "rebalance"}
        onOpenChange={(open) => {
          if (!open) closeModal("rebalance");
        }}
        plan={plan}
        state={rebalanceState}
        position={selectedPosition}
        priorityFeeMicrolamports={priorityFee}
        onConfirm={() => void execute()}
        onCancel={() => {
          closeModal("rebalance");
        }}
      />

      <WithdrawYieldModal
        open={activeModal === "withdraw"}
        onOpenChange={(open) => setActiveModal(open ? "withdraw" : null)}
        treasury={treasury}
      />

      <DepositModal
        open={activeModal === "deposit"}
        onOpenChange={(open) => setActiveModal(open ? "deposit" : null)}
      />
    </div>
  );
}
