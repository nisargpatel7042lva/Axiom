"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Shield,
  Target,
  Gem,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

import { Topbar } from "@/components/layout/Topbar";
import { VAULT_CONFIGS } from "@/constants";
import { formatUsd, formatShares } from "@/components/format";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import {
  useWalletVaultPositions,
  type LiveVaultPosition,
} from "@/hooks/useWalletVaultPositions";
import { useLiveMetricHistory } from "@/hooks/useLiveMetricHistory";
import { usePortfolioActivities } from "@/hooks/usePortfolioActivities";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { inferWalletUsdcFlow } from "@/lib/services/dune-sim";
import type { PortfolioActivity } from "@/lib/portfolio/activity-log";
import { Skeleton } from "@/components/ui/Skeleton";
import { DEVNET_USDC_MINT, USDC_MINT, getNetwork } from "@/lib/spectra/constants";
import { useMatchMedia } from "@/hooks/useMatchMedia";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

const VAULT_ICONS: Record<string, React.ReactNode> = {
  "safe-consensus": <Shield className="size-5" />,
  "macro-contrarian": <Target className="size-5" />,
  "yield-maximizer": <Gem className="size-5" />,
};

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDayMs(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function PortfolioPage() {
  const [chartMode, setChartMode] = useState<"total" | "flow">("total");
  const narrow = useMatchMedia("(max-width: 390px)");
  const { connected, publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const { usdcBalance } = useWalletBalances();
  const { positions, totalValue, loading, error, refetch } = useWalletVaultPositions();
  const chartPoints = useLiveMetricHistory(connected ? totalValue : null);
  const activities = usePortfolioActivities(walletAddress);
  const { transactions } = useTransactionHistory(250);
  const usdcMint = getNetwork() === "mainnet-beta" ? USDC_MINT.toBase58() : DEVNET_USDC_MINT.toBase58();
  const historyActivities = useMemo(() => {
    if (!walletAddress) return activities;
    const localBySig = new Set(
      activities.map((a) => a.txSig).filter((sig): sig is string => Boolean(sig)),
    );
    const inferred = transactions
      .map((tx) => inferWalletUsdcFlow(tx, walletAddress, usdcMint))
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .filter((x) => !localBySig.has(x.txSig))
      .map(
        (x): PortfolioActivity => ({
          id: `chain-${x.txSig}`,
          wallet: walletAddress,
          vaultId: "unknown",
          vaultName: "Axiom Vaults",
          ticker: "USDC",
          kind: x.kind,
          amountUsdc: x.amountUsdc,
          txSig: x.txSig,
          timestamp: x.timestamp,
        }),
      );
    return [...activities, ...inferred].sort((a, b) => a.timestamp - b.timestamp);
  }, [activities, transactions, walletAddress, usdcMint]);
  const vaultActivityTotals = useMemo(() => {
    const totals = new Map<string, { invested: number; withdrawn: number }>();
    for (const a of historyActivities) {
      const row = totals.get(a.vaultId) ?? { invested: 0, withdrawn: 0 };
      if (a.kind === "deposit") row.invested += a.amountUsdc;
      else row.withdrawn += a.amountUsdc;
      totals.set(a.vaultId, row);
    }
    return totals;
  }, [historyActivities]);

  const chartSeries = useMemo(() => {
    const now = Date.now();
    const todayStart = startOfDayMs(now);
    const firstDay = todayStart - 14 * 24 * 60 * 60 * 1000;

    if (historyActivities.length === 0) {
      if (chartPoints.length >= 2) {
        return {
          total: chartPoints,
          flow: chartPoints.map((d) => ({ ...d, value: 0 })),
        };
      }
      if (totalValue > 0) {
        const fallback = [
          {
            date: new Date(firstDay).toLocaleDateString("en-US", { day: "numeric", month: "long" }),
            value: 0,
            t: firstDay,
          },
          {
            date: new Date(todayStart).toLocaleDateString("en-US", { day: "numeric", month: "long" }),
            value: totalValue,
            t: todayStart,
          },
        ];
        return {
          total: fallback,
          flow: fallback.map((d) => ({ ...d, value: 0 })),
        };
      }
      return { total: [], flow: [] };
    }

    const dailyFlow = new Map<string, { invested: number; withdrawn: number }>();
    for (const a of historyActivities) {
      if (a.timestamp < firstDay || a.timestamp > now) continue;
      const k = dayKey(a.timestamp);
      const row = dailyFlow.get(k) ?? { invested: 0, withdrawn: 0 };
      if (a.kind === "deposit") row.invested += a.amountUsdc;
      else row.withdrawn += a.amountUsdc;
      dailyFlow.set(k, row);
    }

    const dailyTotal = [];
    const dailyFlowSeries = [];
    let cumulative = 0;
    let hasAnyFlowInWindow = false;
    for (let i = 0; i < 15; i++) {
      const ts = firstDay + i * 24 * 60 * 60 * 1000;
      const k = dayKey(ts);
      const flow = dailyFlow.get(k) ?? { invested: 0, withdrawn: 0 };
      const netFlow = flow.invested - flow.withdrawn;
      if (flow.invested > 0 || flow.withdrawn > 0) hasAnyFlowInWindow = true;
      cumulative += netFlow;
      cumulative = Math.max(0, cumulative);
      dailyTotal.push({
        t: ts,
        date: new Date(ts).toLocaleDateString("en-US", { day: "numeric", month: "long" }),
        value: cumulative,
      });
      dailyFlowSeries.push({
        t: ts,
        date: new Date(ts).toLocaleDateString("en-US", { day: "numeric", month: "long" }),
        value: netFlow,
      });
    }

    if (!hasAnyFlowInWindow) {
      if (chartPoints.length >= 2) {
        return {
          total: chartPoints,
          flow: chartPoints.map((d) => ({ ...d, value: 0 })),
        };
      }
      if (totalValue > 0) {
        const fallback = [
          {
            date: new Date(firstDay).toLocaleDateString("en-US", { day: "numeric", month: "long" }),
            value: 0,
            t: firstDay,
          },
          {
            date: new Date(todayStart).toLocaleDateString("en-US", { day: "numeric", month: "long" }),
            value: totalValue,
            t: todayStart,
          },
        ];
        return {
          total: fallback,
          flow: fallback.map((d) => ({ ...d, value: 0 })),
        };
      }
      return { total: [], flow: [] };
    }

    const last = dailyTotal[dailyTotal.length - 1];
    const scale = last && last.value > 0 && totalValue > 0 ? totalValue / last.value : 1;
    return {
      total: dailyTotal.map((d) => ({ ...d, value: d.value * scale })),
      flow: dailyFlowSeries,
    };
  }, [historyActivities, chartPoints, totalValue]);

  const chartData = chartMode === "total" ? chartSeries.total : chartSeries.flow;

  if (!connected) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14]">
        <Topbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-3 pt-[5.75rem] min-[391px]:px-4 min-[391px]:pt-[6rem]">
          <Wallet className="size-12 text-[#8b9cb3]" />
          <h2 className="text-xl font-semibold text-[#e8edf5]">Connect Wallet</h2>
          <p className="max-w-sm text-center text-sm text-[#8b9cb3]">
            Connect your Solana wallet to view vault share balances and redeemable USDC from
            devnet.
          </p>
          <WalletMultiButton className="!mt-2 !rounded-xl !bg-[#00e5c3] !px-8 !py-3 !text-sm !font-bold !text-[#080c14]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 pb-8 pt-[5.75rem] min-[391px]:px-4 min-[391px]:pt-[6rem] md:px-6 md:pb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-[#e8edf5] min-[391px]:text-2xl md:text-3xl">Portfolio</h1>
          <p className="mt-1 text-sm text-[#8b9cb3]">
            Live positions from devnet vault share tokens (Token-2022) in your wallet.
          </p>
        </motion.div>

        {error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100 min-[391px]:px-4">
            <span>{error.message}</span>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/15"
            >
              Retry
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 grid grid-cols-1 gap-3 min-[391px]:gap-4 sm:grid-cols-3"
        >
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
              Redeemable value
            </div>
            <div className="mt-2 font-[family-name:var(--font-space-mono)] text-xl font-bold text-[#e8edf5] min-[391px]:text-2xl">
              {loading ? (
                <Skeleton className="h-8 w-32 bg-white/5" />
              ) : (
                formatUsd(totalValue)
              )}
            </div>
            <p className="mt-1 text-[10px] text-[#8b9cb3]">From on-chain withdraw preview</p>
          </div>
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
              Vaults with shares
            </div>
            <div className="mt-2 font-[family-name:var(--font-space-mono)] text-xl font-bold text-[#e8edf5] min-[391px]:text-2xl">
              {loading ? <Skeleton className="h-8 w-12 bg-white/5" /> : positions.length}
            </div>
            <div className="text-sm text-[#8b9cb3]">of {VAULT_CONFIGS.length} strategies</div>
          </div>
          {usdcBalance > 0 && (
            <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
                Wallet USDC
              </div>
              <div className="mt-2 font-[family-name:var(--font-space-mono)] text-xl font-bold text-[#e8edf5] min-[391px]:text-2xl">
                {formatUsd(usdcBalance)}
              </div>
              <div className="text-[10px] text-[#8b9cb3]">via Dune SIM</div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6"
        >
          <div className="mb-3 flex flex-col gap-2 min-[391px]:flex-row min-[391px]:items-center min-[391px]:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#e8edf5]">Portfolio chart</h3>
              <p className="mt-1 text-[10px] text-[#8b9cb3]">
                15-day view · switch between value trend and daily net movement.
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-[#1a2235] bg-[#080c14] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <button
                type="button"
                onClick={() => setChartMode("total")}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold tracking-wide transition-all min-[391px]:px-3 ${chartMode === "total"
                    ? "bg-[#00e5c3] text-[#080c14] shadow-[0_0_0_1px_rgba(0,229,195,0.25)]"
                    : "text-[#8b9cb3] hover:bg-white/[0.04] hover:text-[#e8edf5]"
                  }`}
              >
                Total Value
              </button>
              <button
                type="button"
                onClick={() => setChartMode("flow")}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold tracking-wide transition-all min-[391px]:px-3 ${chartMode === "flow"
                    ? "bg-[#6366f1] text-white shadow-[0_0_0_1px_rgba(99,102,241,0.25)]"
                    : "text-[#8b9cb3] hover:bg-white/[0.04] hover:text-[#e8edf5]"
                  }`}
              >
                Daily Flow
              </button>
            </div>
          </div>
          <p className="mb-2 text-[10px] text-[#8b9cb3] min-[391px]:mb-3 max-[390px]:leading-snug">
            {chartMode === "total"
              ? "15-day estimated portfolio total. Backfilled from on-chain USDC flow plus local app logs."
              : "15-day net daily flow (deposits - withdrawals). Positive means net inflow."}
          </p>
          <div className="mb-3 flex items-center gap-3 text-[10px] text-[#8b9cb3]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: chartMode === "total" ? "#00e5c3" : "#6366f1" }}
              />
              {chartMode === "total" ? "Total value trend" : "Net daily flow"}
            </span>
            {chartMode === "flow" && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-[1px] w-3 bg-white/25" />
                Zero baseline
              </span>
            )}
          </div>
          <div className="h-48 min-[391px]:h-56">
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={narrow ? "narrow" : "wide"} data={chartData}>
                  <defs>
                    <linearGradient id="portfolio-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e5c3" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00e5c3" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="flow-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(139,156,179,0.12)" strokeDasharray="3 4" vertical={false} />
                  {chartMode === "flow" && (
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.28)" strokeDasharray="4 4" />
                  )}
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={[startOfDayMs(Date.now()) - 14 * 24 * 60 * 60 * 1000, startOfDayMs(Date.now())]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b9cb3", fontSize: 10 }}
                    tickFormatter={(v: number) =>
                      new Date(v).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: narrow ? "short" : "long",
                      })
                    }
                    minTickGap={narrow ? 22 : 30}
                  />
                  <YAxis
                    domain={(range: [number, number]) => {
                      const [min, max] = range;
                      if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
                      if (min === max) {
                        const pad = Math.max(0.01, Math.abs(min) * 0.005);
                        return [min - pad, max + pad];
                      }
                      const pad = (max - min) * 0.08;
                      return [min - pad, max + pad];
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b9cb3", fontSize: narrow ? 9 : 10 }}
                    tickFormatter={(v: number) => formatUsd(v)}
                    width={narrow ? 56 : 72}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0d1420",
                      border: "1px solid #1a2235",
                      borderRadius: 10,
                      fontSize: narrow ? 11 : 12,
                      maxWidth: narrow ? 200 : 280,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                    }}
                    labelStyle={{ color: "#8b9cb3" }}
                    labelFormatter={(v: number) =>
                      new Date(v).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: narrow ? "short" : "long",
                      })
                    }
                    formatter={(value: number) => [
                      formatUsd(value),
                      chartMode === "total" ? "Portfolio value" : "Net flow",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartMode === "total" ? "#00e5c3" : "#6366f1"}
                    strokeWidth={2}
                    fill={chartMode === "total" ? "url(#portfolio-gradient)" : "url(#flow-gradient)"}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#8b9cb3]">
                {loading
                  ? "Loading devnet balances…"
                  : "No vault share positions yet. Deposit from a vault page to mint shares."}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <h3 className="mb-3 text-base font-semibold text-[#e8edf5] min-[391px]:mb-4 min-[391px]:text-lg">
            Your positions
          </h3>
          <div className="space-y-4">
            {positions.map((pos: LiveVaultPosition) => {
              const cfg = pos.config;
              const pps = pos.uiState?.pricePerShare ?? 0;
              const totals = vaultActivityTotals.get(pos.vaultId) ?? { invested: 0, withdrawn: 0 };
              const netInvested = Math.max(0, totals.invested - totals.withdrawn);
              const pnl = pos.currentValueUsdc - netInvested;
              const pnlPositive = pnl >= 0;
              return (
                <Link
                  key={pos.vaultId}
                  href={`/vaults/${pos.vaultId}`}
                  className="group block"
                >
                  <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4 transition-all hover:border-[#00e5c3]/30 min-[391px]:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex size-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${cfg.accentColor}20`,
                            color: cfg.accentColor,
                          }}
                        >
                          {VAULT_ICONS[cfg.id] ?? <TrendingUp className="size-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-semibold text-[#e8edf5]">{cfg.name}</h4>
                            <ArrowUpRight className="size-4 shrink-0 text-[#8b9cb3] opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8b9cb3] min-[391px]:text-xs">
                            <span className="font-[family-name:var(--font-space-mono)]">
                              {formatShares(pos.sharesHuman)} {cfg.ticker}
                            </span>
                            <span className="hidden sm:inline">·</span>
                            <span className="font-[family-name:var(--font-space-mono)]">
                              PPS ${pps.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3 sm:flex sm:items-center sm:gap-6 sm:border-t-0 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <div className="text-xs text-[#8b9cb3]">Redeemable</div>
                          <div className="font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5]">
                            {formatUsd(pos.currentValueUsdc)}
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xs text-[#8b9cb3]">P&amp;L</div>
                          <div
                            className={`font-[family-name:var(--font-space-mono)] text-sm font-semibold ${pnlPositive ? "text-emerald-400" : "text-rose-400"
                              }`}
                          >
                            {pnlPositive ? "+" : "-"}
                            {formatUsd(Math.abs(pnl))}
                          </div>
                          <div className="text-[10px] text-[#8b9cb3] min-[391px]:text-xs">
                            vs {formatUsd(netInvested)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {positions.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 rounded-2xl border border-dashed border-[#1a2235] bg-[#0d1420]/50 p-5 text-center min-[391px]:p-8"
          >
            <p className="text-sm text-[#8b9cb3]">
              No vault share tokens detected. Explore strategies on the home page and deposit on
              devnet.
            </p>
            <Link
              href="/vaults"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#00e5c3] px-6 py-2.5 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
            >
              Explore vaults
              <ExternalLink className="size-4" />
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
