"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart2, RefreshCw, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Topbar } from "@/components/layout/Topbar";
import { SiteAuroraBackdrop } from "@/components/layout/SiteAuroraBackdrop";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PpsSnapshot {
  timestamp: string;
  pps: number;
  totalNav: number;
  predictionPositionsValue: number;
  lendingBalance: number;
  idleUsdc: number;
}

interface ClosedPositionRecord {
  marketId: string;
  title: string;
  side: "yes" | "no";
  entryPrice: number;
  exitPrice: number;
  usdcDeployed: number;
  pnlUsdc: number;
  holdTimeHours: number;
  openedAt: string;
  closedAt: string;
  outcome: "won" | "lost";
}

interface VaultStats {
  totalOpened: number;
  won: number;
  lost: number;
  winRatePct: number;
  totalRealizedPnlUsdc: number;
  avgHoldTimeHours: number;
}

interface VaultPerformance {
  ppsHistory: PpsSnapshot[];
  closedPositions: ClosedPositionRecord[];
  totalOpened: number;
  stats: VaultStats;
}

interface PerformanceData {
  lastUpdatedAt: string;
  vaults: Record<string, VaultPerformance>;
}

interface EngineHealth {
  lastScan: string | null;
  lastNavSync: string | null;
  lastPositionCheck: string | null;
  rpcProvider: string;
  rpcFastStreamActive: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VAULT_META: Record<string, { name: string; color: string }> = {
  "safe-consensus":   { name: "Safe Consensus",  color: "#00D4AA" },
  "macro-contrarian": { name: "Macro Contrarian", color: "#4F8EF7" },
  "yield-maximizer":  { name: "Yield Maximizer",  color: "#9B7FE8" },
};

const SPRING = {
  stiff:  { type: "spring" as const, stiffness: 350, damping: 28 },
  smooth: { type: "spring" as const, stiffness: 300, damping: 30 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string | null): string {
  if (!ts) return "Never";
  const ms = Date.now() - Date.parse(ts);
  if (!Number.isFinite(ms) || ms < 0) return "Just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtUsd(v: number): string {
  const abs = Math.abs(v);
  const s = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(abs);
  return v < 0 ? `-${s}` : s;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 56, H = 28;
  if (data.length === 0) return <div style={{ width: W, height: H }} />;
  if (data.length === 1) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <circle cx={W / 2} cy={H / 2} r={3} fill={color} opacity={0.9} />
      </svg>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.0001;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 6) - 3}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <polyline
        points={pts}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── PPS Chart (recharts smooth curves) ──────────────────────────────────────

interface ChartRow { label: string; [key: string]: number | string }

function PpsChart({ data }: { data: PerformanceData }) {
  const { chartData, sparse } = useMemo(() => {
    const vaultEntries = Object.entries(data.vaults);
    const tsSet = new Set<string>();
    for (const [, vp] of vaultEntries) {
      for (const s of vp.ppsHistory) tsSet.add(s.timestamp);
    }
    const sorted = [...tsSet].sort();

    const spanMs = sorted.length > 1
      ? Date.parse(sorted.at(-1)!) - Date.parse(sorted[0])
      : 0;
    const useTime = spanMs < 48 * 3_600_000;

    const rows = sorted.map((ts) => {
      const row: ChartRow = {
        label: useTime
          ? new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
          : new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
      for (const [vaultId, vp] of vaultEntries) {
        const snap = [...vp.ppsHistory]
          .filter((s) => s.timestamp <= ts)
          .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
        if (snap) row[vaultId] = parseFloat(snap.pps.toFixed(6));
      }
      return row;
    });

    return { chartData: rows, sparse: rows.length < 6 };
  }, [data]);

  const vaultEntries = Object.entries(data.vaults);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-[#1E2D4A]/60 bg-[#0A0F1E]/40">
        <RefreshCw className="size-5 animate-spin text-[#8b9cb3]/50" />
        <p className="text-sm text-[#8b9cb3]">Waiting for first engine cycle…</p>
      </div>
    );
  }

  if (chartData.length === 1) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-[#1E2D4A]/60 bg-[#0A0F1E]/40">
        <p className="text-sm text-[#8b9cb3]">1 snapshot — chart builds after more cycles.</p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          {vaultEntries.map(([vaultId, vp]) => {
            const meta = VAULT_META[vaultId];
            const pps = vp.ppsHistory[0]?.pps;
            return pps != null ? (
              <div key={vaultId} className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: meta?.color }} />
                <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs text-[#8b9cb3]">{meta?.name}</span>
                <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold text-[#e8edf5]">${pps.toFixed(6)}</span>
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Legend at top */}
      <div className="mb-4 flex flex-wrap items-center gap-5">
        {vaultEntries.map(([vaultId]) => {
          const meta = VAULT_META[vaultId] ?? { name: vaultId, color: "#8b9cb3" };
          return (
            <div key={vaultId} className="flex items-center gap-2">
              <svg width={20} height={2} aria-hidden="true">
                <line x1={0} y1={1} x2={20} y2={1} stroke={meta.color} strokeWidth={2} strokeLinecap="round" />
              </svg>
              <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs text-[#8b9cb3]">
                {meta.name}
              </span>
            </div>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(30,45,74,0.6)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#8b9cb3", fontSize: 10, fontFamily: "var(--font-ibm-plex-mono)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis
            tick={{ fill: "#8b9cb3", fontSize: 10, fontFamily: "var(--font-ibm-plex-mono)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(3)}`}
            width={62}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#0F1629",
              border: "1px solid #1E2D4A",
              borderRadius: 10,
              fontSize: 11,
              color: "#e8edf5",
              padding: "8px 12px",
              fontFamily: "var(--font-ibm-plex-mono)",
            }}
            formatter={(value: number, name: string) => [
              `$${value.toFixed(6)}`,
              VAULT_META[name]?.name ?? name,
            ]}
            labelStyle={{ color: "#8b9cb3", marginBottom: 6 }}
            cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
          />
          {vaultEntries.map(([vaultId]) => {
            const meta = VAULT_META[vaultId] ?? { color: "#8b9cb3" };
            return (
              <Line
                key={vaultId}
                type="monotone"
                dataKey={vaultId}
                stroke={meta.color}
                strokeWidth={2}
                dot={sparse ? { r: 4, fill: meta.color, stroke: "#0F1629", strokeWidth: 2 } : false}
                activeDot={{ r: 4, fill: meta.color, stroke: "#0F1629", strokeWidth: 2 }}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [data,       setData]       = useState<PerformanceData | null>(null);
  const [health,     setHealth]     = useState<EngineHealth | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stage,      setStage]      = useState(0);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [perfRes, transRes] = await Promise.all([
        fetch("/api/engine/performance"),
        fetch("/api/engine/transparency"),
      ]);
      if (perfRes.ok) {
        setData(await perfRes.json() as PerformanceData);
        setError(null);
      } else {
        setError("Engine offline — performance data unavailable");
      }
      if (transRes.ok) {
        const t = await transRes.json() as { health?: EngineHealth };
        setHealth(t.health ?? null);
      }
    } catch {
      setError("Could not reach engine API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const id = setInterval(() => void fetchData(), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    if (loading) return;
    const t1 = setTimeout(() => setStage(1), 60);
    const t2 = setTimeout(() => setStage(2), 180);
    const t3 = setTimeout(() => setStage(3), 320);
    const t4 = setTimeout(() => setStage(4), 460);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [loading]);

  const vaultEntries = useMemo(
    () => (data ? Object.entries(data.vaults) : []),
    [data],
  );

  const allClosed = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.vaults)
      .flatMap(([vaultId, vp]) => vp.closedPositions.map((p) => ({ ...p, vaultId })))
      .sort((a, b) => Date.parse(b.closedAt) - Date.parse(a.closedAt))
      .slice(0, 50);
  }, [data]);

  return (
    <div className="relative min-h-screen bg-[#0A0F1E]">
      <SiteAuroraBackdrop />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Topbar />

        <main className="flex-1 pt-[6rem]">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">

            {/* ── Header ──────────────────────────────────── */}
            <motion.div
              initial={false}
              animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : -12 }}
              transition={SPRING.stiff}
              className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00D4AA]/25 bg-[#00D4AA]/10 px-3 py-1 text-xs font-semibold text-[#00D4AA]">
                  <BarChart2 className="size-3.5" />
                  Live engine data
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#e8edf5] md:text-4xl">
                  Performance
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8b9cb3]">
                  Vault PPS history, closed position records, win rates, and realized PnL across all strategies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void fetchData()}
                disabled={refreshing}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-[#1E2D4A] bg-[#0F1629] px-3.5 py-2 text-sm text-[#8b9cb3] transition-all hover:border-[#1E2D4A]/80 hover:text-[#e8edf5] disabled:opacity-40 md:self-auto"
              >
                <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </motion.div>

            {/* ── Error ───────────────────────────────────── */}
            {error && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void fetchData()}
                  className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/15"
                >
                  Retry
                </button>
              </div>
            )}

            {/* ── Vault stat cards ─────────────────────────── */}
            <motion.div
              initial={false}
              animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 16 }}
              transition={SPRING.smooth}
              className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-40 animate-pulse rounded-xl border border-[#1E2D4A] bg-[#0F1629]" />
                  ))
                : vaultEntries.map(([vaultId, vp]) => {
                    const meta = VAULT_META[vaultId] ?? { name: vaultId, color: "#8b9cb3" };
                    const currentPps = vp.ppsHistory.at(-1)?.pps ?? 1;
                    const firstPps   = vp.ppsHistory[0]?.pps ?? 1;
                    const delta      = ((currentPps - firstPps) / firstPps) * 100;
                    return (
                      <div
                        key={vaultId}
                        className="rounded-xl border border-[#1E2D4A] bg-[#0F1629] p-4 min-[391px]:p-5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div
                              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                              style={{ background: `${meta.color}18`, color: meta.color }}
                            >
                              <TrendingUp className="size-2.5" />
                              {meta.name}
                            </div>
                            <div className="mt-2 font-[family-name:var(--font-ibm-plex-mono)] text-xl font-semibold text-[#e8edf5] min-[391px]:text-2xl">
                              ${currentPps.toFixed(6)}
                            </div>
                            <div
                              className={`mt-0.5 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-medium ${
                                delta >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {delta >= 0 ? "+" : ""}{delta.toFixed(3)}% since launch
                            </div>
                          </div>
                          <Sparkline data={vp.ppsHistory.map((s) => s.pps)} color={meta.color} />
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#1E2D4A] pt-3">
                          <div className="text-center">
                            <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">Win rate</div>
                            <div className="mt-1 font-[family-name:var(--font-ibm-plex-mono)] text-sm font-semibold text-[#e8edf5]">
                              {vp.stats.winRatePct.toFixed(0)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">PnL</div>
                            <div
                              className={`mt-1 font-[family-name:var(--font-ibm-plex-mono)] text-sm font-semibold ${
                                vp.stats.totalRealizedPnlUsdc >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {vp.stats.totalRealizedPnlUsdc >= 0 ? "+" : ""}
                              {fmtUsd(vp.stats.totalRealizedPnlUsdc)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">W / L</div>
                            <div className="mt-1 font-[family-name:var(--font-ibm-plex-mono)] text-sm font-semibold text-[#e8edf5]">
                              {vp.stats.won}/{vp.stats.lost}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </motion.div>

            {/* ── PPS History Chart ────────────────────────── */}
            <motion.div
              initial={false}
              animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 12 }}
              transition={SPRING.smooth}
              className="mt-6 rounded-2xl border border-[#1E2D4A] bg-[#0F1629] p-4 min-[391px]:p-6"
            >
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-[#e8edf5]">PPS History</h2>
                <p className="mt-1 text-xs text-[#8b9cb3]">Price per share across all vaults over time.</p>
              </div>
              {loading
                ? <div className="mt-4 h-[260px] animate-pulse rounded-xl bg-[#080c14]/60" />
                : data && <PpsChart data={data} />}
            </motion.div>

            {/* ── Closed positions + Health ────────────────── */}
            <motion.div
              initial={false}
              animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 12 }}
              transition={SPRING.smooth}
              className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]"
            >
              {/* Closed positions table */}
              <section className="rounded-2xl border border-[#1E2D4A] bg-[#0F1629] p-4 min-[391px]:p-6">
                <h2 className="text-sm font-semibold text-[#e8edf5]">Position History</h2>
                <p className="mt-1 text-xs text-[#8b9cb3]">Last 50 resolved positions across all vaults.</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[580px] text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                        <th className="pb-3">Market</th>
                        <th className="pb-3">Vault</th>
                        <th className="pb-3">Side</th>
                        <th className="pb-3">Entry</th>
                        <th className="pb-3">Exit</th>
                        <th className="pb-3">PnL</th>
                        <th className="pb-3">Hold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                              <td colSpan={7} className="pb-2">
                                <div className="h-5 animate-pulse rounded-lg bg-[#1E2D4A]/60" />
                              </td>
                            </tr>
                          ))
                        : allClosed.length === 0
                        ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-[#8b9cb3]">
                              No closed positions yet.
                            </td>
                          </tr>
                        )
                        : allClosed.map((p, i) => {
                            const meta = VAULT_META[p.vaultId] ?? { name: p.vaultId, color: "#8b9cb3" };
                            return (
                              <tr
                                key={`${p.marketId}-${i}`}
                                className="border-t border-[#1E2D4A]/50"
                              >
                                <td className="max-w-[150px] truncate py-2.5 pr-4 text-[#c9d4e5]" title={p.title}>
                                  {p.title.length > 26 ? `${p.title.slice(0, 26)}…` : p.title}
                                </td>
                                <td className="py-2.5 pr-4">
                                  <span className="text-[10px] font-semibold" style={{ color: meta.color }}>
                                    {meta.name}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-4">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                      p.side === "yes"
                                        ? "bg-emerald-500/15 text-emerald-300"
                                        : "bg-rose-500/15 text-rose-300"
                                    }`}
                                  >
                                    {p.side}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-4 font-[family-name:var(--font-ibm-plex-mono)] text-[#c9d4e5]">
                                  ${p.entryPrice.toFixed(4)}
                                </td>
                                <td className="py-2.5 pr-4 font-[family-name:var(--font-ibm-plex-mono)] text-[#c9d4e5]">
                                  ${p.exitPrice.toFixed(4)}
                                </td>
                                <td
                                  className={`py-2.5 pr-4 font-[family-name:var(--font-ibm-plex-mono)] font-semibold ${
                                    p.pnlUsdc >= 0 ? "text-emerald-400" : "text-rose-400"
                                  }`}
                                >
                                  {p.pnlUsdc >= 0 ? "+" : ""}{fmtUsd(p.pnlUsdc)}
                                </td>
                                <td className="py-2.5 font-[family-name:var(--font-ibm-plex-mono)] text-[#8b9cb3]">
                                  {p.holdTimeHours.toFixed(1)}h
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Engine health */}
              <section className="rounded-2xl border border-[#1E2D4A] bg-[#0F1629] p-4 min-[391px]:p-6">
                <h2 className="text-sm font-semibold text-[#e8edf5]">Engine Health</h2>
                <p className="mt-1 text-xs text-[#8b9cb3]">Data freshness and job run times.</p>

                <div className="mt-4 space-y-2">
                  {[
                    { label: "Last scan",     value: health ? timeAgo(health.lastScan)    : "—" },
                    { label: "Last NAV sync", value: health ? timeAgo(health.lastNavSync)  : "—" },
                    { label: "RPC provider",  value: health?.rpcProvider ?? "—" },
                    { label: "Data age",      value: data   ? timeAgo(data.lastUpdatedAt) : "—" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border border-[#1E2D4A]/60 bg-[#0A0F1E]/60 px-3 py-2.5"
                    >
                      <span className="text-xs text-[#8b9cb3]">{label}</span>
                      <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs font-medium text-[#e8edf5]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {data && vaultEntries.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-[#8b9cb3]">
                      Open positions
                    </div>
                    {vaultEntries.map(([vaultId, vp]) => {
                      const meta = VAULT_META[vaultId] ?? { name: vaultId, color: "#8b9cb3" };
                      const openCount = Math.max(0, vp.totalOpened - vp.stats.won - vp.stats.lost);
                      return (
                        <div
                          key={vaultId}
                          className="rounded-lg border border-[#1E2D4A]/60 bg-[#0A0F1E]/60 px-3 py-2.5"
                        >
                          <div
                            className="text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: meta.color }}
                          >
                            {meta.name}
                          </div>
                          <div className="mt-0.5 font-[family-name:var(--font-ibm-plex-mono)] text-xs text-[#e8edf5]">
                            {openCount} open · {vp.closedPositions.length} closed
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#1E2D4A]/50 bg-[#0A0F1E]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-[#8b9cb3] md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-2.5">
              <Image
                src="/axiom-logo.png"
                alt="Axiom"
                width={20}
                height={20}
                className="object-contain opacity-60"
              />
              <span className="font-[family-name:var(--font-ibm-plex-mono)]">Axiom Vaults — devnet</span>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              {(["/", "/vaults", "/transparency", "/portfolio"] as const).map((href) => (
                <Link key={href} href={href} className="capitalize transition-colors hover:text-[#00D4AA]">
                  {href === "/" ? "Home" : href.slice(1).charAt(0).toUpperCase() + href.slice(2)}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
