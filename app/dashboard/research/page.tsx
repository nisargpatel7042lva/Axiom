"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { CopilotResearchWorkspace } from "@/components/copilot/CopilotResearchPanel";
import { Topbar, type FlowrTopbarTreasury } from "@/components/layout/Topbar";
import { usePositions } from "@/components/integrations/usePositions";

import Decimal from "decimal.js";

export default function ResearchPage() {
  const { connected, connecting } = useWallet();
  const router = useRouter();
  const { positions, treasury, isLoading } = usePositions();

  useEffect(() => {
    if (!connecting && !connected) {
      router.replace("/");
    }
  }, [connected, connecting, router]);

  const headerTreasury: FlowrTopbarTreasury | null = (() => {
    if (isLoading) return null;
    const totalTvl = positions.reduce(
      (acc, p) => acc.plus(p.metrics.tvlUsd),
      new Decimal(0),
    );
    return {
      ...treasury,
      totalTvlUsd: totalTvl,
      netYieldUsd: treasury.pendingPayoutUsdc,
    };
  })();

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

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 md:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <nav className="text-xs text-[#8b9cb3]">
              <Link href="/dashboard" className="hover:text-[#e8edf5]">
                Dashboard
              </Link>
              <span className="mx-2 text-white/20">/</span>
              <span className="text-[#e8edf5]">Colosseum Copilot</span>
            </nav>
            <h1 className="mt-2 text-2xl font-semibold text-[#e8edf5]">
              Side-by-side research
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#8b9cb3]">
              Compare your Flowr brief with Colosseum hackathon projects and the
              curated archive. Set{" "}
              <code className="rounded bg-white/5 px-1 font-[family-name:var(--font-space-mono)] text-xs">
                COLOSSEUM_COPILOT_PAT
              </code>{" "}
              in{" "}
              <code className="rounded bg-white/5 px-1 font-[family-name:var(--font-space-mono)] text-xs">
                .env.local
              </code>{" "}
              (never commit it).
            </p>
          </div>
        </div>

        <CopilotResearchWorkspace />
      </main>
    </div>
  );
}
