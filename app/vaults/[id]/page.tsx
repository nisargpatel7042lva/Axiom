"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Target,
  Gem,
  TrendingUp,
  Activity,
  PieChart,
  Clock,
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
import { DepositModal } from "@/components/vault/DepositModal";
import { WithdrawModal } from "@/components/vault/WithdrawModal";
import { getVaultConfig, MOCK_VAULT_STATES } from "@/constants";
import { formatUsd, formatPercent } from "@/components/format";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import type { VaultId, VaultActivity } from "@/types";

const VAULT_ICONS: Record<string, React.ReactNode> = {
  "safe-consensus": <Shield className="size-6" />,
  "macro-contrarian": <Target className="size-6" />,
  "yield-maximizer": <Gem className="size-6" />,
};

function generatePerformanceData(vaultId: string) {
  const base = vaultId === "macro-contrarian" ? 1.0 : vaultId === "yield-maximizer" ? 1.0 : 1.0;
  const volatility = vaultId === "macro-contrarian" ? 0.015 : vaultId === "yield-maximizer" ? 0.005 : 0.003;
  const trend = vaultId === "macro-contrarian" ? 0.003 : vaultId === "yield-maximizer" ? 0.002 : 0.001;

  const points = [];
  let price = base;
  const now = Date.now();

  for (let i = 90; i >= 0; i--) {
    const noise = (Math.random() - 0.4) * volatility;
    price = Math.max(base * 0.95, price + trend + noise);
    points.push({
      date: new Date(now - i * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pps: Number(price.toFixed(4)),
    });
  }
  return points;
}

const MOCK_ACTIVITIES: VaultActivity[] = [
  { id: "1", type: "prediction_buy", amount: 5200, description: "Bought YES on 'ETH > $4000 by June' @ 0.72", timestamp: new Date(Date.now() - 3_600_000).toISOString() },
  { id: "2", type: "lend_deposit", amount: 15000, description: "Deployed 15,000 USDC to Jupiter Lend", timestamp: new Date(Date.now() - 7_200_000).toISOString() },
  { id: "3", type: "prediction_sell", amount: 3100, description: "Sold YES on 'BTC > $100k by May' @ 0.91 (profit)", timestamp: new Date(Date.now() - 14_400_000).toISOString() },
  { id: "4", type: "deposit", amount: 10000, description: "User deposit: 10,000 USDC", timestamp: new Date(Date.now() - 28_800_000).toISOString() },
  { id: "5", type: "lend_withdraw", amount: 8000, description: "Withdrew 8,000 USDC from Jupiter Lend for rebalance", timestamp: new Date(Date.now() - 43_200_000).toISOString() },
];

const ACTIVITY_ICONS: Record<string, string> = {
  deposit: "text-[#00e5c3]",
  withdraw: "text-[#ef4444]",
  prediction_buy: "text-[#00e5c3]",
  prediction_sell: "text-[#f59e0b]",
  lend_deposit: "text-[#8b5cf6]",
  lend_withdraw: "text-[#8b5cf6]",
  fee_collection: "text-[#8b9cb3]",
};

export default function VaultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const config = getVaultConfig(id);
  const state = MOCK_VAULT_STATES[id];
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [chartRange, setChartRange] = useState<"7d" | "30d" | "90d">("30d");
  const { transactions: duneTxns } = useTransactionHistory(10);

  const perfData = useMemo(() => generatePerformanceData(id), [id]);

  const chartData = useMemo(() => {
    const sliceMap = { "7d": 7, "30d": 30, "90d": 90 };
    return perfData.slice(-sliceMap[chartRange]);
  }, [perfData, chartRange]);

  if (!config || !state) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14]">
        <Topbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[#8b9cb3]">Vault not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-[#8b9cb3] hover:text-[#e8edf5] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Vaults
        </button>

        {/* Vault Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between"
        >
          <div className="flex items-start gap-4">
            <div
              className="flex size-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${config.accentColor}20`, color: config.accentColor }}
            >
              {VAULT_ICONS[config.id] ?? <TrendingUp className="size-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#e8edf5] md:text-3xl">
                {config.name}
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-[family-name:var(--font-space-mono)] text-sm text-[#8b9cb3]">
                  {config.ticker}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${config.accentColor}20`,
                    color: config.accentColor,
                  }}
                >
                  {config.riskLevel === "low" ? "Low Risk" : config.riskLevel === "medium" ? "Medium Risk" : "High Risk"}
                </span>
              </div>
              <p className="mt-3 max-w-xl text-sm text-[#8b9cb3]">
                {config.strategy}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDeposit(true)}
              className="rounded-xl bg-[#00e5c3] px-6 py-3 text-sm font-bold text-[#080c14] transition-colors hover:bg-[#33ebd3]"
            >
              Deposit USDC
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="rounded-xl border border-[#1a2235] bg-[#0d1420] px-6 py-3 text-sm font-medium text-[#e8edf5] transition-colors hover:border-[#00e5c3]/30"
            >
              Withdraw
            </button>
          </div>
        </motion.div>

        {/* KPI Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5"
        >
          {[
            { label: "NAV", value: formatUsd(state.nav) },
            {
              label: "Price / Share",
              value: `$${state.pricePerShare.toFixed(3)}`,
              color: config.accentColor,
            },
            {
              label: "24h Return",
              value: `${state.last24hReturn >= 0 ? "+" : ""}${formatPercent(state.last24hReturn)}`,
              color: state.last24hReturn >= 0 ? "#00e5c3" : "#ef4444",
            },
            {
              label: "Sharpe Ratio",
              value: state.sharpeRatio.toFixed(2),
            },
            {
              label: "Max Drawdown",
              value: formatPercent(state.maxDrawdown),
              color: "#ef4444",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4"
            >
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                {label}
              </div>
              <div
                className="mt-1 font-[family-name:var(--font-space-mono)] text-lg font-bold"
                style={{ color: color ?? "#e8edf5" }}
              >
                {value}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[#8b9cb3]" />
              <h3 className="text-sm font-semibold text-[#e8edf5]">
                Price Per Share
              </h3>
            </div>
            <div className="flex gap-1">
              {(["7d", "30d", "90d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    chartRange === range
                      ? "bg-white/10 text-[#00e5c3]"
                      : "text-[#8b9cb3] hover:text-[#e8edf5]"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={config.accentColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={config.accentColor} stopOpacity={0} />
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
                  domain={["dataMin - 0.01", "dataMax + 0.01"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8b9cb3", fontSize: 10 }}
                  tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  width={55}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0d1420",
                    border: "1px solid #1a2235",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#8b9cb3" }}
                  formatter={(value: number) => [`$${value.toFixed(4)}`, "PPS"]}
                />
                <Area
                  type="monotone"
                  dataKey="pps"
                  stroke={config.accentColor}
                  strokeWidth={2}
                  fill={`url(#gradient-${id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Two-column: Allocation + Activity */}
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {/* NAV Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="size-4 text-[#8b9cb3]" />
              <h3 className="text-sm font-semibold text-[#e8edf5]">
                NAV Breakdown
              </h3>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Active Predictions",
                  value: state.nav - state.lendingDeployed - state.idleUsdc,
                  color: config.accentColor,
                  count: state.activePredictions,
                },
                {
                  label: "Jupiter Lend",
                  value: state.lendingDeployed,
                  color: `${config.accentColor}80`,
                },
                {
                  label: "Idle USDC",
                  value: state.idleUsdc,
                  color: "#1a2235",
                },
              ].map(({ label, value, color, count }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-[#8b9cb3]">
                      {label}
                      {count != null && (
                        <span className="ml-1 text-[10px]">
                          ({count} positions)
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5]">
                    {formatUsd(value)}
                  </span>
                </div>
              ))}
              <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#e8edf5]">
                  Total NAV
                </span>
                <span className="font-[family-name:var(--font-space-mono)] text-sm font-bold text-[#00e5c3]">
                  {formatUsd(state.nav)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3] mb-3">
                Vault Parameters
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Min Deposit</span>
                  <span className="text-[#e8edf5]">{formatUsd(config.minDeposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Management Fee</span>
                  <span className="text-[#00e5c3]">0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Performance Fee</span>
                  <span className="text-[#e8edf5]">{config.performanceFeeBps / 100}% above HWM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">High Water Mark</span>
                  <span className="font-[family-name:var(--font-space-mono)] text-[#e8edf5]">
                    ${state.highWaterMark.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-4 text-[#8b9cb3]" />
              <h3 className="text-sm font-semibold text-[#e8edf5]">
                Recent Activity
              </h3>
            </div>
            <div className="space-y-0">
              {MOCK_ACTIVITIES.map((activity, i) => {
                const elapsed = Date.now() - new Date(activity.timestamp).getTime();
                const hours = Math.floor(elapsed / 3_600_000);
                const timeLabel = hours < 1 ? "< 1h ago" : `${hours}h ago`;

                return (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 py-3 ${i > 0 ? "border-t border-white/5" : ""}`}
                  >
                    <div className={`mt-0.5 ${ACTIVITY_ICONS[activity.type] ?? "text-[#8b9cb3]"}`}>
                      <Activity className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e8edf5] truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
                          {formatUsd(activity.amount)}
                        </span>
                        <span className="text-xs text-[#8b9cb3]">
                          {timeLabel}
                        </span>
                        {activity.txSignature && (
                          <a
                            href={`https://solscan.io/tx/${activity.txSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener"
                            className="text-xs text-[#00e5c3] hover:underline inline-flex items-center gap-0.5"
                          >
                            <ExternalLink className="size-3" />
                            Tx
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dune SIM live transactions */}
            {duneTxns.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3] mb-3 flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-50" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[#00e5c3]" />
                  </span>
                  Live Wallet Transactions (Dune SIM)
                </div>
                {duneTxns.slice(0, 5).map((tx) => (
                  <div key={tx.hash} className="flex items-start gap-3 py-2 border-t border-white/5">
                    <Activity className="mt-0.5 size-3.5 text-[#8b9cb3]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#e8edf5] truncate font-[family-name:var(--font-space-mono)]">
                        {tx.hash.slice(0, 8)}…{tx.hash.slice(-6)}
                      </p>
                      <span className="text-[10px] text-[#8b9cb3]">
                        {new Date(tx.block_time).toLocaleString()}
                      </span>
                    </div>
                    <a
                      href={`https://solscan.io/tx/${tx.hash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener"
                      className="text-[10px] text-[#00e5c3] hover:underline inline-flex items-center gap-0.5"
                    >
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <DepositModal
        vaultConfig={config}
        open={showDeposit}
        onOpenChange={setShowDeposit}
      />
      <WithdrawModal
        vaultConfig={config}
        vaultState={state}
        open={showWithdraw}
        onOpenChange={setShowWithdraw}
      />
    </div>
  );
}
