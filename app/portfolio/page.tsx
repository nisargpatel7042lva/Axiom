"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
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
import { VAULT_CONFIGS, MOCK_VAULT_STATES } from "@/constants";
import { formatUsd, formatPercent } from "@/components/format";
import type { UserVaultPosition } from "@/types";

const VAULT_ICONS: Record<string, React.ReactNode> = {
  "safe-consensus": <Shield className="size-5" />,
  "macro-contrarian": <Target className="size-5" />,
  "yield-maximizer": <Gem className="size-5" />,
};

const MOCK_POSITIONS: UserVaultPosition[] = [
  {
    vaultId: "safe-consensus",
    shares: 4_523.12,
    depositedUsdc: 4_500,
    currentValue: 4_749.28,
    pnl: 249.28,
    pnlPercent: 5.54,
    depositedAt: new Date(Date.now() - 45 * 86_400_000).toISOString(),
  },
  {
    vaultId: "yield-maximizer",
    shares: 2_100.0,
    depositedUsdc: 2_100,
    currentValue: 2_352.0,
    pnl: 252.0,
    pnlPercent: 12.0,
    depositedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  },
];

function generatePortfolioData() {
  const points = [];
  let value = 6_600;
  const now = Date.now();
  for (let i = 60; i >= 0; i--) {
    value = value + (Math.random() - 0.35) * 40;
    points.push({
      date: new Date(now - i * 86_400_000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: Number(value.toFixed(2)),
    });
  }
  return points;
}

export default function PortfolioPage() {
  const { connected } = useWallet();
  const portfolioData = useMemo(() => generatePortfolioData(), []);

  const totalValue = MOCK_POSITIONS.reduce((s, p) => s + p.currentValue, 0);
  const totalPnl = MOCK_POSITIONS.reduce((s, p) => s + p.pnl, 0);
  const totalDeposited = MOCK_POSITIONS.reduce(
    (s, p) => s + p.depositedUsdc,
    0,
  );
  const totalPnlPercent =
    totalDeposited > 0 ? (totalPnl / totalDeposited) * 100 : 0;

  if (!connected) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14]">
        <Topbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <Wallet className="size-12 text-[#8b9cb3]" />
          <h2 className="text-xl font-semibold text-[#e8edf5]">
            Connect Wallet
          </h2>
          <p className="max-w-sm text-center text-sm text-[#8b9cb3]">
            Connect your Solana wallet to view your vault positions and
            portfolio performance.
          </p>
          <WalletMultiButton className="!mt-2 !rounded-xl !bg-[#00e5c3] !px-8 !py-3 !text-sm !font-bold !text-[#080c14]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-[#e8edf5] md:text-3xl">
            Portfolio
          </h1>
          <p className="mt-1 text-sm text-[#8b9cb3]">
            Your vault positions and overall performance.
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
              Total Value
            </div>
            <div className="mt-2 font-[family-name:var(--font-space-mono)] text-2xl font-bold text-[#e8edf5]">
              {formatUsd(totalValue)}
            </div>
          </div>
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
              Total P&L
            </div>
            <div
              className={`mt-2 font-[family-name:var(--font-space-mono)] text-2xl font-bold ${
                totalPnl >= 0 ? "text-[#00e5c3]" : "text-[#ef4444]"
              }`}
            >
              {totalPnl >= 0 ? "+" : ""}
              {formatUsd(totalPnl)}
            </div>
            <div
              className={`text-sm ${totalPnlPercent >= 0 ? "text-[#00e5c3]" : "text-[#ef4444]"}`}
            >
              {totalPnlPercent >= 0 ? "+" : ""}
              {formatPercent(totalPnlPercent)}
            </div>
          </div>
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3]">
              Active Vaults
            </div>
            <div className="mt-2 font-[family-name:var(--font-space-mono)] text-2xl font-bold text-[#e8edf5]">
              {MOCK_POSITIONS.length}
            </div>
            <div className="text-sm text-[#8b9cb3]">
              of {VAULT_CONFIGS.length} available
            </div>
          </div>
        </motion.div>

        {/* Portfolio Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6"
        >
          <h3 className="text-sm font-semibold text-[#e8edf5] mb-4">
            Portfolio Value (60d)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioData}>
                <defs>
                  <linearGradient
                    id="portfolio-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#00e5c3"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="#00e5c3"
                      stopOpacity={0}
                    />
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
                  domain={["dataMin - 100", "dataMax + 100"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8b9cb3", fontSize: 10 }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                  width={50}
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
          </div>
        </motion.div>

        {/* Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <h3 className="text-lg font-semibold text-[#e8edf5] mb-4">
            Your Positions
          </h3>
          <div className="space-y-4">
            {MOCK_POSITIONS.map((pos) => {
              const config = VAULT_CONFIGS.find(
                (v) => v.id === pos.vaultId,
              )!;
              const state = MOCK_VAULT_STATES[pos.vaultId];
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
                            backgroundColor: `${config.accentColor}20`,
                            color: config.accentColor,
                          }}
                        >
                          {VAULT_ICONS[config.id] ?? (
                            <TrendingUp className="size-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[#e8edf5]">
                              {config.name}
                            </h4>
                            <ArrowUpRight className="size-4 text-[#8b9cb3] opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#8b9cb3]">
                            <span className="font-[family-name:var(--font-space-mono)]">
                              {pos.shares.toLocaleString()} {config.ticker}
                            </span>
                            <span>·</span>
                            <span>
                              PPS: $
                              {state.pricePerShare.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-[#8b9cb3]">Value</div>
                          <div className="font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5]">
                            {formatUsd(pos.currentValue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#8b9cb3]">P&L</div>
                          <div
                            className={`font-[family-name:var(--font-space-mono)] text-sm font-semibold ${
                              pos.pnl >= 0
                                ? "text-[#00e5c3]"
                                : "text-[#ef4444]"
                            }`}
                          >
                            {pos.pnl >= 0 ? "+" : ""}
                            {formatUsd(pos.pnl)}
                          </div>
                          <div
                            className={`text-xs ${
                              pos.pnlPercent >= 0
                                ? "text-[#00e5c3]"
                                : "text-[#ef4444]"
                            }`}
                          >
                            {pos.pnlPercent >= 0 ? "+" : ""}
                            {formatPercent(pos.pnlPercent)}
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

        {/* CTA for empty vaults */}
        {MOCK_POSITIONS.length < VAULT_CONFIGS.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 rounded-2xl border border-dashed border-[#1a2235] bg-[#0d1420]/50 p-8 text-center"
          >
            <p className="text-sm text-[#8b9cb3]">
              You have{" "}
              {VAULT_CONFIGS.length - MOCK_POSITIONS.length} more vault
              {VAULT_CONFIGS.length - MOCK_POSITIONS.length > 1
                ? "s"
                : ""}{" "}
              available to deposit into.
            </p>
            <Link
              href="/#vaults"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#00e5c3] px-6 py-2.5 text-sm font-bold text-[#080c14] hover:bg-[#33ebd3]"
            >
              Explore Vaults
              <ExternalLink className="size-4" />
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
