"use client";

import { use, useEffect, useState, useMemo } from "react";
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
  PauseCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import BN from "bn.js";

import { Topbar } from "@/components/layout/Topbar";
import { DepositModal } from "@/components/vault/DepositModal";
import { WithdrawModal } from "@/components/vault/WithdrawModal";
import { getVaultConfig } from "@/constants";
import { RiskRatingPanel } from "@/components/vault/RiskRatingPanel";
import { VaultTransparencyPanel } from "@/components/vault/VaultTransparencyPanel";
import { ExposureVenues } from "@/components/vault/ExposureVenues";
import { formatUsd, formatPercent, formatShares } from "@/components/format";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useDevnetVaults } from "@/hooks/useDevnetVaults";
import { usePpsSessionHistory } from "@/hooks/usePpsSessionHistory";
import { useVaultUserShares } from "@/hooks/useVaultUserShares";
import { parseActivityFeed } from "@/lib/services/dune-sim";
import { usePortfolioActivities } from "@/hooks/usePortfolioActivities";
import type { VaultId } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { VaultPrismBackdrop } from "@/components/vault/VaultPrismBackdrop";
import { useMatchMedia } from "@/hooks/useMatchMedia";
import { useWallet } from "@solana/wallet-adapter-react";

const VAULT_ICONS: Record<string, React.ReactNode> = {
  "safe-consensus": <Shield className="size-6" />,
  "macro-contrarian": <Target className="size-6" />,
  "yield-maximizer": <Gem className="size-6" />,
};

const CHART_RANGES = ["1m", "5m", "15m", "1d", "1y"] as const;
type ChartRange = (typeof CHART_RANGES)[number];
const RANGE_MS: Record<Exclude<ChartRange, "1y">, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1d": 24 * 60 * 60_000,
};

function formatXAxisForRange(ts: number, range: ChartRange): string {
  const d = new Date(ts);
  if (range === "1m" || range === "5m" || range === "15m") {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  if (range === "1d") {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function VaultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const config = getVaultConfig(id);
  const vaultKey = id as VaultId;

  const { byVaultId, loading, refetch } = useDevnetVaults();
  const row = config ? byVaultId[vaultKey] : undefined;
  const state = row?.ui ?? null;
  const snapshot = row?.snapshot;
  const onChain = snapshot?.onChain ?? null;
  const custodyUsdc =
    snapshot != null
      ? Number(snapshot.custodyLamports.toString(10)) / 10 ** 6
      : 0;
  const navDrift = custodyUsdc - (state?.nav ?? 0);

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>("15m");
  const [visibleActivityCount, setVisibleActivityCount] = useState(5);
  const { connected, publicKey } = useWallet();
  const {
    transactions: duneTxns,
    isLoading: txLoading,
    error: txError,
  } = useTransactionHistory(12);
  const localActivities = usePortfolioActivities(
    connected && publicKey ? publicKey.toBase58() : null,
  );

  const { chartData: sessionPps } = usePpsSessionHistory(
    state?.pricePerShare ?? null,
    22_000,
    config?.id
  );

  const chartData = useMemo(() => {
    if (sessionPps.length === 0) return [];
    if (chartRange === "1y") return sessionPps;

    const cutoff = Date.now() - RANGE_MS[chartRange];
    const inRange = sessionPps.filter((point) => point.t >= cutoff);

    // Add one anchor point just before cutoff to keep line continuity.
    const anchor = [...sessionPps].reverse().find((point) => point.t < cutoff);
    const withAnchor = anchor ? [anchor, ...inRange] : inRange;

    if (withAnchor.length >= 2) return withAnchor;

    // If there is too little data for the selected range, use the latest two
    // fetched points so user still sees most-recent movement.
    return sessionPps.slice(-Math.min(sessionPps.length, 2));
  }, [sessionPps, chartRange]);

  const chartMeta = useMemo(() => {
    if (chartData.length === 0) {
      return { yDomain: ["auto", "auto"] as [string, string], yDecimals: 4 };
    }
    const values = chartData.map((p) => p.pps);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min;

    // Keep micro-moves visible (especially when PPS changes are tiny).
    const pad = spread > 0 ? spread * 0.15 : Math.max(Math.abs(min) * 0.001, 0.0001);
    const yDomain: [number, number] = [Math.max(0, min - pad), max + pad];

    const yDecimals = spread >= 0.1 ? 2 : spread >= 0.01 ? 3 : 4;
    return { yDomain, yDecimals };
  }, [chartData]);

  const parsedActivity = useMemo(
    () => parseActivityFeed(duneTxns),
    [duneTxns],
  );
  const localVaultActivityFeed = useMemo(
    () => {
      if (!config) return [];
      return localActivities
        .filter((row) => row.vaultId === config.id)
        .map((row) => ({
          action:
            row.kind === "deposit"
              ? `Deposited ${formatUsd(row.amountUsdc)} to vault`
              : `Withdrew ${formatUsd(row.amountUsdc)} from vault`,
          timestamp: new Date(row.timestamp).toISOString(),
          hash: row.txSig ?? row.id,
        }));
    },
    [localActivities, config],
  );

  const activityFeed = useMemo(() => {
    const combined = [...localVaultActivityFeed, ...parsedActivity];
    const dedup = new Map<string, (typeof combined)[number]>();
    for (const item of combined) {
      if (!dedup.has(item.hash)) dedup.set(item.hash, item);
    }
    return Array.from(dedup.values()).sort(
      (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
    );
  }, [localVaultActivityFeed, parsedActivity]);

  useEffect(() => {
    setVisibleActivityCount(5);
  }, [activityFeed.length, id]);

  const visibleActivityFeed = useMemo(
    () => activityFeed.slice(0, visibleActivityCount),
    [activityFeed, visibleActivityCount],
  );

  const { data: userSharesLamports, isLoading: sharesLoading } =
    useVaultUserShares(config?.chainVaultId ?? null);

  const sharesBn = userSharesLamports ?? new BN(0);
  const narrow = useMatchMedia("(max-width: 390px)");

  if (!config) {
    return (
      <div className="relative min-h-screen bg-[#080c14]">
        <VaultPrismBackdrop />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Topbar />
          <div className="flex flex-1 items-center justify-center px-3 pb-8 pt-[5.75rem] min-[391px]:px-4 min-[391px]:pt-[6rem]">
            <p className="text-[#8b9cb3]">Vault not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const kpiLoading = loading && !state;


  return (
    <div className="relative min-h-screen bg-[#080c14]">
      <VaultPrismBackdrop vaultId={vaultKey} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Topbar />

        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 pb-8 pt-[5.75rem] min-[391px]:px-4 min-[391px]:pt-[6rem] md:px-6 md:pb-10">
        <button
          type="button"
          onClick={() => router.push("/vaults")}
          className="mb-5 flex items-center gap-2 text-sm text-[#8b9cb3] transition-colors hover:text-[#e8edf5] max-[390px]:mb-4"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="hidden min-[391px]:inline">Back to catalog</span>
          <span className="min-[391px]:hidden">Back</span>
        </button>

        {!snapshot && !loading && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100 min-[391px]:px-4">
            This vault account is not initialized on the current RPC (devnet). From the
            repo root, deploy the program then run{" "}
            <span className="font-mono">npm run init:vaults:devnet</span> (bootstraps vault id{" "}
            <span className="font-mono">{config.chainVaultId}</span>
            ) so on-chain state exists for live metrics.
          </div>
        )}

        {/* Vault Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3 min-[391px]:gap-4">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl min-[391px]:size-14"
              style={{ backgroundColor: `${config.accentColor}20`, color: config.accentColor }}
            >
              {VAULT_ICONS[config.id] ?? <TrendingUp className="size-5 min-[391px]:size-6" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#e8edf5] min-[391px]:text-2xl md:text-3xl">
                {config.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3">
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
                  {config.riskLevel === "low"
                    ? "Low Risk"
                    : config.riskLevel === "medium"
                      ? "Medium Risk"
                      : "High Risk"}
                </span>
                {onChain?.isPaused && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                    <PauseCircle className="size-3.5" />
                    Paused
                  </span>
                )}
              </div>
              <p className="mt-3 max-w-xl text-sm text-[#8b9cb3]">{config.strategy}</p>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 min-[391px]:w-auto min-[391px]:flex-row min-[391px]:flex-wrap min-[391px]:items-center min-[391px]:gap-3">
            <div className="grid w-full grid-cols-2 gap-2 min-[391px]:flex min-[391px]:w-auto min-[391px]:flex-row min-[391px]:gap-3">
            <button
              type="button"
              onClick={() => setShowDeposit(true)}
              disabled={!onChain || onChain.isPaused}
              className="rounded-xl bg-[#00e5c3] px-4 py-2.5 text-sm font-bold text-[#080c14] transition-colors hover:bg-[#33ebd3] disabled:cursor-not-allowed disabled:opacity-40 min-[391px]:px-6 min-[391px]:py-3"
            >
              Deposit USDC
            </button>
            <button
              type="button"
              onClick={() => setShowWithdraw(true)}
              disabled={!onChain || onChain.isPaused}
              className="rounded-xl border border-[#1a2235] bg-[#0d1420] px-4 py-2.5 text-sm font-medium text-[#e8edf5] transition-colors hover:border-[#00e5c3]/30 disabled:cursor-not-allowed disabled:opacity-40 min-[391px]:px-6 min-[391px]:py-3"
            >
              Withdraw
            </button>
            </div>
          </div>
        </motion.div>
        <div className="mt-3 rounded-lg border border-[#1a2235] bg-[#0d1420] px-3 py-2 text-xs text-[#8b9cb3]">
          NAV and yield are engine-controlled. This vault updates automatically from scheduled strategy runs.
        </div>

        {/* KPI Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 grid grid-cols-2 gap-2 min-[391px]:mt-8 min-[391px]:gap-4 md:grid-cols-5"
        >
          {[
            { label: "NAV (synced)", value: state ? formatUsd(state.nav) : null },
            {
              label: "Price / Share",
              value: state ? `$${state.pricePerShare.toFixed(4)}` : null,
              color: config.accentColor,
            },
            {
              label: "Custody USDC",
              value: snapshot ? formatUsd(custodyUsdc) : null,
            },
            {
              label: "Total shares",
              value: state ? formatShares(state.totalShares) : null,
            },
            {
              label: "Performance fee",
              value: onChain ? `${onChain.performanceFeeBps / 100}%` : null,
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-3 min-[391px]:p-4"
            >
              <div className="text-[9px] font-medium uppercase tracking-wider text-[#8b9cb3] min-[391px]:text-xs">
                {label}
              </div>
              <div
                className="mt-1 min-h-[1.5rem] font-[family-name:var(--font-space-mono)] text-base font-bold min-[391px]:min-h-[1.75rem] min-[391px]:text-lg"
                style={{ color: color ?? "#e8edf5" }}
              >
                {kpiLoading || value == null ? (
                  <Skeleton className="mt-1 h-6 w-24 bg-white/5" />
                ) : (
                  value
                )}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:mt-8 min-[391px]:p-6"
        >
          <div className="mb-3 flex flex-col gap-3 min-[391px]:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Activity className="size-4 shrink-0 text-[#8b9cb3]" />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#e8edf5]">Price per share</h3>
                <p className="text-xs text-[#8b9cb3] max-[390px]:leading-snug">
                  Live samples from this browser session (devnet polls)
                </p>
              </div>
            </div>
            <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] max-[390px]:snap-x max-[390px]:snap-mandatory sm:mx-0 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {CHART_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setChartRange(range)}
                  className={`shrink-0 snap-start rounded-lg px-2.5 py-1 text-xs font-medium transition-colors min-[391px]:px-3 min-[391px]:text-xs ${
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
          <div className="h-52 min-[391px]:h-60 md:h-64">
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={`${chartRange}-${narrow ? "n" : "w"}`} data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={config.accentColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={config.accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b9cb3", fontSize: narrow ? 9 : 10 }}
                    interval="preserveStartEnd"
                    minTickGap={narrow ? 18 : 8}
                    tickFormatter={(value: number) =>
                      formatXAxisForRange(value, chartRange)
                    }
                  />
                  <YAxis
                    domain={chartMeta.yDomain}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b9cb3", fontSize: narrow ? 9 : 10 }}
                    tickFormatter={(v: number) => `$${v.toFixed(chartMeta.yDecimals)}`}
                    width={narrow ? 40 : 52}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0d1420",
                      border: "1px solid #1a2235",
                      borderRadius: 8,
                      fontSize: narrow ? 11 : 12,
                      maxWidth: narrow ? 200 : 280,
                    }}
                    labelStyle={{ color: "#8b9cb3" }}
                    labelFormatter={(value) =>
                      new Date(Number(value)).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
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
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#8b9cb3]">
                {loading
                  ? "Loading vault…"
                  : "Chart fills as PPS updates are sampled while you keep this page open."}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 grid min-w-0 gap-4 min-[391px]:mt-8 min-[391px]:gap-6 lg:grid-cols-2"
        >
          <div className="min-w-0 space-y-4 min-[391px]:space-y-6">
            <RiskRatingPanel name={config.name} riskSheet={config.riskSheet} />
          </div>
          <div className="min-w-0 space-y-4 min-[391px]:space-y-6">
            <VaultTransparencyPanel chainVaultId={config.chainVaultId} />
            <div className="rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
              <h3 className="text-sm font-semibold text-[#e8edf5] mb-1">Venue exposure</h3>
              <p className="text-xs text-[#8b9cb3] mb-3">
                Named venues replace anonymous tiles — you always know where risk is expressed.
              </p>
              <ExposureVenues
                embedded
                venues={config.exposureVenues}
                accentColor={config.accentColor}
              />
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid min-w-0 gap-4 min-[391px]:mt-8 min-[391px]:gap-6 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="size-4 text-[#8b9cb3]" />
              <h3 className="text-sm font-semibold text-[#e8edf5]">On-chain liquidity</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Reported NAV (program)", value: state?.nav ?? 0 },
                { label: "USDC in vault ATA", value: custodyUsdc },
                { label: "Custody − NAV", value: navDrift },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col gap-0.5 max-[390px]:items-start max-[390px]:gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
                >
                  <span className="min-w-0 text-xs text-[#8b9cb3] min-[391px]:text-sm">{label}</span>
                  <span className="font-[family-name:var(--font-space-mono)] text-xs font-semibold text-[#e8edf5] min-[391px]:text-sm max-[390px]:self-end sm:self-auto">
                    {kpiLoading && !snapshot ? (
                      <Skeleton className="h-4 w-20 bg-white/5" />
                    ) : (
                      formatUsd(value)
                    )}
                  </span>
                </div>
              ))}
              <p className="text-xs leading-relaxed text-[#8b9cb3] pt-2 border-t border-white/5">
                NAV follows `total_assets` from the program. The vault token account may differ until
                the engine runs `sync_nav` or after user flows settle.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-white/5">
              <div className="text-xs font-medium uppercase tracking-wider text-[#8b9cb3] mb-3">
                Vault parameters
              </div>
              <div className="space-y-2 text-xs min-[391px]:text-sm">
                <div className="flex flex-col gap-0.5 max-[390px]:items-start sm:flex-row sm:justify-between sm:gap-2">
                  <span className="text-[#8b9cb3]">Min deposit</span>
                  <span className="text-[#e8edf5] max-[390px]:self-end sm:self-auto">{formatUsd(config.minDeposit)}</span>
                </div>
                <div className="flex flex-col gap-0.5 max-[390px]:items-start sm:flex-row sm:justify-between sm:gap-2">
                  <span className="text-[#8b9cb3]">Management fee</span>
                  <span className="text-[#00e5c3] max-[390px]:self-end sm:self-auto">0%</span>
                </div>
                <div className="flex flex-col gap-0.5 max-[390px]:items-start sm:flex-row sm:justify-between sm:gap-2">
                  <span className="min-w-0 shrink text-[#8b9cb3] max-[390px]:max-w-[11rem]">
                    Performance fee
                  </span>
                  <span className="text-right text-[#e8edf5] max-[390px]:self-end sm:self-auto sm:text-left">
                    {config.performanceFeeBps / 100}% above HWM
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 max-[390px]:items-start sm:flex-row sm:justify-between sm:gap-2">
                  <span className="text-[#8b9cb3]">High water mark</span>
                  <span className="font-[family-name:var(--font-space-mono)] text-[#e8edf5] max-[390px]:self-end sm:self-auto">
                    {state ? `$${state.highWaterMark.toFixed(4)}` : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 max-[390px]:items-start sm:flex-row sm:justify-between sm:gap-2">
                  <span className="text-[#8b9cb3]">Your shares</span>
                  <span className="min-w-0 max-w-full break-words text-right font-[family-name:var(--font-space-mono)] text-[#e8edf5] max-[390px]:self-end sm:self-auto sm:text-left">
                    {sharesLoading ? (
                      <Skeleton className="inline-block h-4 w-16 bg-white/5" />
                    ) : (
                      `${formatShares(Number(sharesBn.toString(10)) / 1e9)} ${config.ticker}`
                    )}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#8b9cb3]" />
                <h3 className="text-sm font-semibold text-[#e8edf5]">Activity</h3>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f59e0b] opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[#f59e0b]" />
                </span>
                <span className="text-[9px] font-semibold text-[#f59e0b]">Dune SIM</span>
              </div>
            </div>

            {activityFeed.length > 0 ? (
              <div className="space-y-0">
                {visibleActivityFeed.map((item, i) => (
                  <div
                    key={item.hash}
                    className={`flex items-start gap-3 py-3 ${i > 0 ? "border-t border-white/5" : ""}`}
                  >
                    <Activity className="mt-0.5 size-4 text-[#00e5c3]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e8edf5]">{item.action}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#8b9cb3]">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        <a
                          href={`https://solscan.io/tx/${item.hash}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[#00e5c3] hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          Solscan
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                {activityFeed.length > 5 && (
                  <div className="border-t border-white/5 pt-3">
                    {visibleActivityCount < activityFeed.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleActivityCount((prev) =>
                            Math.min(prev + 5, activityFeed.length),
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#00e5c3] hover:underline"
                      >
                        <ChevronDown className="size-3.5" />
                        Show more
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setVisibleActivityCount(5)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#8b9cb3] hover:text-[#e8edf5]"
                      >
                        <ChevronUp className="size-3.5" />
                        Show less
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#8b9cb3]">
                {!connected
                  ? "Connect your wallet to load recent transactions via Dune SIM. Vault activity appears after your first deposit/withdraw."
                  : txLoading
                    ? "Loading recent wallet transactions…"
                    : txError
                      ? "Could not load Dune SIM transactions right now. New deposit/withdraw activity will still appear after successful vault actions."
                      : "No recent activity for this vault yet. Make a deposit or withdrawal to populate this feed."}
              </p>
            )}
          </motion.div>
        </div>
      </main>

      <DepositModal
        vaultConfig={config}
        chainVaultId={config.chainVaultId}
        onChainVault={onChain}
        uiVaultState={state}
        open={showDeposit}
        onOpenChange={setShowDeposit}
        onDeposited={() => void refetch()}
      />
      <WithdrawModal
        vaultConfig={config}
        chainVaultId={config.chainVaultId}
        onChainVault={onChain}
        uiVaultState={state}
        userSharesLamports={sharesBn}
        open={showWithdraw}
        onOpenChange={setShowWithdraw}
        onWithdrawn={() => void refetch()}
      />
      </div>
    </div>
  );
}
