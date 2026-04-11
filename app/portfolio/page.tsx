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

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { usdcBalance } = useWalletBalances();
  const { positions, totalValue, loading, error, refetch } = useWalletVaultPositions();
  const chartPoints = useLiveMetricHistory(connected ? totalValue : null);

  const chartData = useMemo(() => {
    if (chartPoints.length >= 2) return chartPoints;
    if (totalValue > 0) {
      const t = Date.now();
      return [
        {
          date: new Date(t - 60_000).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          value: totalValue,
          t: t - 60_000,
        },
        {
          date: new Date(t).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          value: totalValue,
          t,
        },
      ];
    }
    return [];
  }, [chartPoints, totalValue]);

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
            Points append when devnet data refreshes — not a full historical backfill.
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
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b9cb3", fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={["auto", "auto"]}
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
                    formatter={(value: number) => [formatUsd(value), "Value"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#00e5c3"
                    strokeWidth={2}
                    fill="url(#portfolio-gradient)"
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
