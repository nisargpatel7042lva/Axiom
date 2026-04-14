"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
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
import type { PortfolioActivity } from "@/lib/portfolio/activity-log";
import { Skeleton } from "@/components/ui/Skeleton";

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
  const { connected, publicKey } = useWallet();
  const { usdcBalance } = useWalletBalances();
  const { positions, totalValue, loading, error, refetch } = useWalletVaultPositions();
  const chartPoints = useLiveMetricHistory(connected ? totalValue : null, 24 * 60 * 60 * 1000);
  const activities = usePortfolioActivities(publicKey?.toBase58() ?? null);

  const chartData = useMemo(() => {
    const now = Date.now();
    const todayStart = startOfDayMs(now);
    const firstDay = todayStart - 14 * 24 * 60 * 60 * 1000;

    if (activities.length === 0) {
      if (chartPoints.length >= 2) return chartPoints;
      if (totalValue > 0) {
        return [
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
      }
      return [];
    }

    const dailyFlow = new Map<string, { invested: number; withdrawn: number }>();
    for (const a of activities) {
      if (a.timestamp < firstDay || a.timestamp > now) continue;
      const k = dayKey(a.timestamp);
      const row = dailyFlow.get(k) ?? { invested: 0, withdrawn: 0 };
      if (a.kind === "deposit") row.invested += a.amountUsdc;
      else row.withdrawn += a.amountUsdc;
      dailyFlow.set(k, row);
    }

    const daily = [];
    let cumulative = 0;
    for (let i = 0; i < 15; i++) {
      const ts = firstDay + i * 24 * 60 * 60 * 1000;
      const k = dayKey(ts);
      const flow = dailyFlow.get(k) ?? { invested: 0, withdrawn: 0 };
      cumulative += flow.invested - flow.withdrawn;
      cumulative = Math.max(0, cumulative);
      daily.push({
        t: ts,
        date: new Date(ts).toLocaleDateString("en-US", { day: "numeric", month: "long" }),
        value: cumulative,
      });
    }

    const last = daily[daily.length - 1];
    const scale = last && last.value > 0 && totalValue > 0 ? totalValue / last.value : 1;
    return daily.map((d) => ({ ...d, value: d.value * scale }));
  }, [activities, chartPoints, totalValue]);

  if (!connected) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14]">
        <Topbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pt-[6rem]">
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-[6rem] md:px-6 md:pb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[#e8edf5] md:text-3xl">Portfolio</h1>
          <p className="mt-1 text-sm text-[#8b9cb3]">
            Live positions from devnet vault share tokens (Token-2022) in your wallet.
          </p>
        </motion.div>

        {error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
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
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
              Redeemable value
            </div>
            <div className="mt-2 font-[family-name:var(--font-space-mono)] text-2xl font-bold text-[#e8edf5]">
              {loading ? (
                <Skeleton className="h-8 w-32 bg-white/5" />
              ) : (
                formatUsd(totalValue)
              )}
            </div>
            <p className="mt-1 text-[10px] text-[#8b9cb3]">From on-chain withdraw preview</p>
          </div>
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
              Vaults with shares
            </div>
            <div className="mt-2 font-[family-name:var(--font-space-mono)] text-2xl font-bold text-[#e8edf5]">
              {loading ? <Skeleton className="h-8 w-12 bg-white/5" /> : positions.length}
            </div>
            <div className="text-sm text-[#8b9cb3]">of {VAULT_CONFIGS.length} strategies</div>
          </div>
          {usdcBalance > 0 && (
            <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
                Wallet USDC
              </div>
              <div className="mt-2 font-[family-name:var(--font-space-mono)] text-2xl font-bold text-[#e8edf5]">
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
          className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6"
        >
          <h3 className="text-sm font-semibold text-[#e8edf5] mb-1">Portfolio value (sampled)</h3>
          <p className="text-[10px] text-[#8b9cb3] mb-4">
            15-day timeline with one sample every 24 hours.
          </p>
          <div className="h-56">
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="portfolio-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e5c3" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00e5c3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                        month: "long",
                      })
                    }
                    minTickGap={30}
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
                    tick={{ fill: "#8b9cb3", fontSize: 10 }}
                    tickFormatter={(v: number) => formatUsd(v)}
                    width={72}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0d1420",
                      border: "1px solid #1a2235",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#8b9cb3" }}
                    labelFormatter={(v: number) =>
                      new Date(v).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                      })
                    }
                    formatter={(value: number) => [formatUsd(value), "Value"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#00e5c3"
                    strokeWidth={2}
                    fill="url(#portfolio-gradient)"
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
          <h3 className="text-lg font-semibold text-[#e8edf5] mb-4">Your positions</h3>
          <div className="space-y-4">
            {positions.map((pos: LiveVaultPosition) => {
              const cfg = pos.config;
              const pps = pos.uiState?.pricePerShare ?? 0;
              return (
                <Link
                  key={pos.vaultId}
                  href={`/vaults/${pos.vaultId}`}
                  className="group block"
                >
                  <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-5 transition-all hover:border-[#00e5c3]/30">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${cfg.accentColor}20`,
                            color: cfg.accentColor,
                          }}
                        >
                          {VAULT_ICONS[cfg.id] ?? <TrendingUp className="size-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[#e8edf5]">{cfg.name}</h4>
                            <ArrowUpRight className="size-4 text-[#8b9cb3] opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#8b9cb3]">
                            <span className="font-[family-name:var(--font-space-mono)]">
                              {formatShares(pos.sharesHuman)} {cfg.ticker}
                            </span>
                            <span>·</span>
                            <span>PPS: ${pps.toFixed(4)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-[#8b9cb3]">Redeemable</div>
                          <div className="font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5]">
                            {formatUsd(pos.currentValueUsdc)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#8b9cb3]">P&amp;L</div>
                          <div className="font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#8b9cb3]">
                            —
                          </div>
                          <div className="text-xs text-[#8b9cb3]">Needs cost basis indexer</div>
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
            className="mt-8 rounded-2xl border border-dashed border-[#1a2235] bg-[#0d1420]/50 p-8 text-center"
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
