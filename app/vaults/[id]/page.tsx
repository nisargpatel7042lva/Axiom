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
  PauseCircle,
  Sparkles,
  Loader2,
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
import { useSimulateYield } from "@/lib/spectra/hooks/use-simulate-yield";
import { parseActivityFeed } from "@/lib/services/dune-sim";
import type { VaultId } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { getNetwork } from "@/lib/spectra/constants";

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
  const [yieldBps, setYieldBps] = useState(300);
  const [simSig, setSimSig] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const { transactions: duneTxns } = useTransactionHistory(12);

  const { chartData: sessionPps } = usePpsSessionHistory(
    state?.pricePerShare ?? null,
    22_000
  );

  const chartData = useMemo(() => {
    if (chartRange === "1y") return sessionPps;
    const cutoff = Date.now() - RANGE_MS[chartRange];
    const filtered = sessionPps.filter((point) => point.t >= cutoff);
    // Keep at least the latest two points so chart renders when window is sparse.
    if (filtered.length >= 2) return filtered;
    return sessionPps.slice(-Math.min(sessionPps.length, 2));
  }, [sessionPps, chartRange]);

  const parsedActivity = useMemo(
    () => parseActivityFeed(duneTxns),
    [duneTxns],
  );

  const { data: userSharesLamports, isLoading: sharesLoading } =
    useVaultUserShares(config?.chainVaultId ?? null);

  const sharesBn = userSharesLamports ?? new BN(0);
  const { simulateYield, loading: simulatingYield } = useSimulateYield(config?.chainVaultId ?? 0);

  if (!config) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14]">
        <Topbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[#8b9cb3]">Vault not found.</p>
        </div>
      </div>
    );
  }

  const kpiLoading = loading && !state;
  const explorerClusterParam = getNetwork() === "mainnet-beta"
    ? ""
    : `?cluster=${getNetwork()}`;

  async function handleSimulateYield() {
    if (!onChain) return;
    setSimError(null);
    setSimSig(null);
    try {
      const sig = await simulateYield(onChain.totalAssets, yieldBps);
      setSimSig(sig);
      await refetch();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: unknown }).message)
            : String(e);
      setSimError(msg || "Failed to simulate yield");
    }
  }


  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-[6rem] md:px-6 md:pb-10">
        <button
          type="button"
          onClick={() => router.push("/vaults")}
          className="mb-6 flex items-center gap-2 text-sm text-[#8b9cb3] hover:text-[#e8edf5] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to catalog
        </button>

        {!snapshot && !loading && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
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

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDeposit(true)}
              disabled={!onChain || onChain.isPaused}
              className="rounded-xl bg-[#00e5c3] px-6 py-3 text-sm font-bold text-[#080c14] transition-colors hover:bg-[#33ebd3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Deposit USDC
            </button>
            <button
              type="button"
              onClick={() => setShowWithdraw(true)}
              disabled={!onChain || onChain.isPaused}
              className="rounded-xl border border-[#1a2235] bg-[#0d1420] px-6 py-3 text-sm font-medium text-[#e8edf5] transition-colors hover:border-[#00e5c3]/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Withdraw
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-[#1a2235] bg-[#0d1420] px-2 py-2">
              <select
                value={yieldBps}
                onChange={(e) => setYieldBps(Number(e.target.value))}
                className="rounded-lg border border-[#1a2235] bg-[#080c14] px-2 py-1 text-xs text-[#e8edf5] focus:border-[#00e5c3]/50 focus:outline-none"
              >
                <option value={100}>+1.0%</option>
                <option value={300}>+3.0%</option>
                <option value={500}>+5.0%</option>
                <option value={1000}>+10.0%</option>
                <option value={-300}>-3.0%</option>
              </select>
              <button
                type="button"
                onClick={() => void handleSimulateYield()}
                disabled={!onChain || simulatingYield}
                className="inline-flex items-center gap-1 rounded-lg bg-[#1e293b] px-3 py-1.5 text-xs font-semibold text-[#e8edf5] hover:bg-[#334155] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {simulatingYield ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Simulating
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Simulate Yield
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {(simSig || simError) && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-xs ${
              simError
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {simError ? (
              <span>{simError}</span>
            ) : (
              <span>Simulated NAV update submitted: {simSig} · <a href={`https://solscan.io/tx/${simSig}${explorerClusterParam}`} target="_blank" rel="noopener noreferrer" className="text-[#00e5c3] hover:underline">View on Solscan</a></span>
            )}
          </div>
        )}

        {/* KPI Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5"
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
              className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4"
            >
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                {label}
              </div>
              <div
                className="mt-1 font-[family-name:var(--font-space-mono)] text-lg font-bold min-h-[1.75rem]"
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
          className="mt-8 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[#8b9cb3]" />
              <div>
                <h3 className="text-sm font-semibold text-[#e8edf5]">Price per share</h3>
                <p className="text-[10px] text-[#8b9cb3]">
                  Live samples from this browser session (devnet polls)
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {CHART_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
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
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={chartRange} data={chartData}>
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
                    tickFormatter={(_value: string, index: number) =>
                      formatXAxisForRange(chartData[index]?.t ?? Date.now(), chartRange)
                    }
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b9cb3", fontSize: 10 }}
                    tickFormatter={(v: number) => `$${v.toFixed(3)}`}
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
          className="mt-8 grid gap-6 lg:grid-cols-2"
        >
          <RiskRatingPanel name={config.name} riskSheet={config.riskSheet} />
          <div className="space-y-6">
            <VaultTransparencyPanel chainVaultId={config.chainVaultId} />
            <div className="rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6">
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

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6"
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
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-[#8b9cb3]">{label}</span>
                  <span className="font-[family-name:var(--font-space-mono)] text-sm font-semibold text-[#e8edf5]">
                    {kpiLoading && !snapshot ? (
                      <Skeleton className="h-4 w-20 bg-white/5" />
                    ) : (
                      formatUsd(value)
                    )}
                  </span>
                </div>
              ))}
              <p className="text-[10px] leading-relaxed text-[#8b9cb3] pt-2 border-t border-white/5">
                NAV follows `total_assets` from the program. The vault token account may differ until
                the engine runs `sync_nav` or after user flows settle.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-white/5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3] mb-3">
                Vault parameters
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-[#8b9cb3]">Min deposit</span>
                  <span className="text-[#e8edf5]">{formatUsd(config.minDeposit)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#8b9cb3]">Management fee</span>
                  <span className="text-[#00e5c3]">0%</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#8b9cb3]">Performance fee</span>
                  <span className="text-[#e8edf5]">{config.performanceFeeBps / 100}% above HWM</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#8b9cb3]">High water mark</span>
                  <span className="font-[family-name:var(--font-space-mono)] text-[#e8edf5]">
                    {state ? `$${state.highWaterMark.toFixed(4)}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#8b9cb3]">Your shares</span>
                  <span className="font-[family-name:var(--font-space-mono)] text-[#e8edf5]">
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
            className="lg:col-span-3 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-4 text-[#8b9cb3]" />
              <h3 className="text-sm font-semibold text-[#e8edf5]">Activity</h3>
            </div>

            {parsedActivity.length > 0 ? (
              <div className="space-y-0">
                {parsedActivity.map((item, i) => (
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
              </div>
            ) : (
              <p className="text-sm text-[#8b9cb3]">
                Connect your wallet to load recent transactions via Dune SIM. On-chain vault events
                will appear here when your wallet has activity.
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
  );
}
