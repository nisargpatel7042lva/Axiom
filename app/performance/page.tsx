"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";

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

const VAULT_META: Record<string, { name: string; color: string }> = {
  "safe-consensus":    { name: "Safe Consensus",   color: "#00e5c3" },
  "macro-contrarian":  { name: "Macro Contrarian",  color: "#6366f1" },
  "yield-maximizer":   { name: "Yield Maximizer",   color: "#8b5cf6" },
};

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
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(abs);
  return v < 0 ? `-${formatted}` : formatted;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-8 w-16" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.0001;
  const W = 64, H = 32;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`)
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

const PAD = { top: 16, right: 24, bottom: 36, left: 60 };

function PpsChart({ data }: { data: PerformanceData }) {
  const vaultEntries = Object.entries(data.vaults);
  const allSnapshots = vaultEntries.flatMap(([, vp]) => vp.ppsHistory);

  if (allSnapshots.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-[#8b9cb3]">
        Not enough PPS history yet — check back after a few engine cycles.
      </div>
    );
  }

  const VW = 800, VH = 240;
  const chartW = VW - PAD.left - PAD.right;
  const chartH = VH - PAD.top - PAD.bottom;

  const allTimes = allSnapshots.map(s => Date.parse(s.timestamp));
  const allPps   = allSnapshots.map(s => s.pps);
  const minTime  = Math.min(...allTimes);
  const maxTime  = Math.max(...allTimes);
  const timeSpan = maxTime - minTime || 1;
  const rawMin   = Math.min(...allPps);
  const rawMax   = Math.max(...allPps);
  const ppsSpan  = rawMax - rawMin || 0.001;
  const yPad     = ppsSpan * 0.12;
  const yMin     = rawMin - yPad;
  const yMax     = rawMax + yPad;
  const ySpan    = yMax - yMin;

  const toX = (ts: string) => PAD.left + ((Date.parse(ts) - minTime) / timeSpan) * chartW;
  const toY = (pps: number) => PAD.top + (1 - (pps - yMin) / ySpan) * chartH;

  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (ySpan * i) / 4);
  const xTicks = Array.from({ length: 5 }, (_, i) => minTime + (timeSpan * i) / 4);

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full"
      style={{ maxHeight: 280 }}
      aria-label="Price per share history chart"
    >
      {/* Grid */}
      {yTicks.map((v) => (
        <line
          key={v}
          x1={PAD.left} x2={VW - PAD.right}
          y1={toY(v)}   y2={toY(v)}
          stroke="#1a2235" strokeWidth={1}
        />
      ))}

      {/* Y labels */}
      {yTicks.map((v) => (
        <text
          key={v}
          x={PAD.left - 6}
          y={toY(v) + 4}
          textAnchor="end"
          fontSize={9}
          fill="#8b9cb3"
          fontFamily="Space Mono, monospace"
        >
          {v.toFixed(4)}
        </text>
      ))}

      {/* X labels */}
      {xTicks.map((t) => (
        <text
          key={t}
          x={PAD.left + ((t - minTime) / timeSpan) * chartW}
          y={VH - 6}
          textAnchor="middle"
          fontSize={9}
          fill="#8b9cb3"
          fontFamily="DM Sans, sans-serif"
        >
          {new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </text>
      ))}

      {/* Vault lines */}
      {vaultEntries.map(([vaultId, vp]) => {
        const meta = VAULT_META[vaultId] ?? { color: "#8b9cb3", name: vaultId };
        const sorted = [...vp.ppsHistory].sort(
          (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
        );
        if (sorted.length < 2) return null;
        const pts = sorted.map(s => `${toX(s.timestamp)},${toY(s.pps)}`).join(" ");
        const last = sorted[sorted.length - 1];
        return (
          <g key={vaultId}>
            <polyline
              points={pts}
              fill="none"
              stroke={meta.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
            <circle cx={toX(last.timestamp)} cy={toY(last.pps)} r={3} fill={meta.color} />
          </g>
        );
      })}

      {/* Axes */}
      <line
        x1={PAD.left} x2={PAD.left}
        y1={PAD.top}  y2={VH - PAD.bottom}
        stroke="#1a2235" strokeWidth={1}
      />
      <line
        x1={PAD.left}       x2={VW - PAD.right}
        y1={VH - PAD.bottom} y2={VH - PAD.bottom}
        stroke="#1a2235" strokeWidth={1}
      />
    </svg>
  );
}

export default function PerformancePage() {
  const [data, setData]           = useState<PerformanceData | null>(null);
  const [health, setHealth]       = useState<EngineHealth | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const vaultEntries = useMemo(
    () => (data ? Object.entries(data.vaults) : []),
    [data],
  );

  const allClosed = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.vaults)
      .flatMap(([vaultId, vp]) =>
        vp.closedPositions.map(p => ({ ...p, vaultId })),
      )
      .sort((a, b) => Date.parse(b.closedAt) - Date.parse(a.closedAt))
      .slice(0, 50);
  }, [data]);

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 pb-8 pt-[5.75rem] min-[391px]:px-4 min-[391px]:pt-[6rem] md:px-6 md:pb-10">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#e8edf5] min-[391px]:text-2xl md:text-3xl">
              Performance Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#8b9cb3]">
              Live vault stats, PPS history, and closed position records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-[#1a2235] bg-[#0d1420] px-3 py-2 text-xs text-[#8b9cb3] transition-colors hover:border-[#00e5c3]/30 hover:text-[#e8edf5] disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Vault stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl border border-[#1a2235] bg-[#0d1420]"
                />
              ))
            : vaultEntries.map(([vaultId, vp]) => {
                const meta = VAULT_META[vaultId] ?? { name: vaultId, color: "#8b9cb3" };
                const currentPps = vp.ppsHistory.at(-1)?.pps ?? 1;
                const firstPps   = vp.ppsHistory[0]?.pps ?? 1;
                const ppsDelta   = ((currentPps - firstPps) / firstPps) * 100;
                return (
                  <div
                    key={vaultId}
                    className="rounded-xl border bg-[#0d1420] p-4"
                    style={{ borderColor: `${meta.color}28` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                          {meta.name}
                        </div>
                        <div className="mt-1 font-mono text-xl font-bold text-[#e8edf5]">
                          ${currentPps.toFixed(6)}
                        </div>
                        <div
                          className={`mt-0.5 text-xs font-medium ${ppsDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {ppsDelta >= 0 ? "+" : ""}
                          {ppsDelta.toFixed(3)}% since inception
                        </div>
                      </div>
                      <Sparkline data={vp.ppsHistory.map(s => s.pps)} color={meta.color} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#1a2235] pt-3 text-center">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#8b9cb3]">Win rate</div>
                        <div className="mt-0.5 text-sm font-semibold text-[#e8edf5]">
                          {vp.stats.winRatePct.toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#8b9cb3]">Total PnL</div>
                        <div
                          className={`mt-0.5 text-sm font-semibold ${vp.stats.totalRealizedPnlUsdc >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {vp.stats.totalRealizedPnlUsdc >= 0 ? "+" : ""}
                          {fmtUsd(vp.stats.totalRealizedPnlUsdc)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#8b9cb3]">W / L</div>
                        <div className="mt-0.5 text-sm font-semibold text-[#e8edf5]">
                          {vp.stats.won} / {vp.stats.lost}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* PPS History Chart */}
        <section className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#e8edf5]">PPS History</h2>
            <div className="flex flex-wrap items-center gap-4">
              {Object.entries(VAULT_META).map(([id, meta]) => (
                <div key={id} className="flex items-center gap-1.5">
                  <div className="h-px w-5 rounded-full" style={{ backgroundColor: meta.color, height: 2 }} />
                  <span className="text-xs text-[#8b9cb3]">{meta.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-44 animate-pulse rounded-lg bg-[#080c14]/60" />
            ) : data ? (
              <PpsChart data={data} />
            ) : null}
          </div>
        </section>

        {/* Closed Positions Table */}
        <section className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
          <h2 className="text-sm font-semibold text-[#e8edf5]">Closed Positions</h2>
          <p className="mt-1 text-xs text-[#8b9cb3]">Last 50 closed positions across all vaults, newest first.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead>
                <tr className="text-[#8b9cb3]">
                  <th className="pb-2 font-medium">Market</th>
                  <th className="pb-2 font-medium">Vault</th>
                  <th className="pb-2 font-medium">Side</th>
                  <th className="pb-2 font-medium">Entry</th>
                  <th className="pb-2 font-medium">Exit</th>
                  <th className="pb-2 font-medium">PnL</th>
                  <th className="pb-2 font-medium">Hold</th>
                  <th className="pb-2 font-medium">Closed</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="py-2">
                          <div className="h-4 animate-pulse rounded bg-[#1a2235]" />
                        </td>
                      </tr>
                    ))
                  : allClosed.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-[#8b9cb3]">
                        No closed positions yet.
                      </td>
                    </tr>
                  )
                  : allClosed.map((p, i) => {
                      const meta = VAULT_META[p.vaultId] ?? { name: p.vaultId, color: "#8b9cb3" };
                      return (
                        <tr
                          key={`${p.marketId}-${i}`}
                          className="border-t border-white/5 text-[#e8edf5]"
                        >
                          <td className="py-2 pr-4 max-w-[180px] truncate" title={p.title}>
                            {p.title.length > 34 ? `${p.title.slice(0, 34)}…` : p.title}
                          </td>
                          <td className="py-2 pr-4">
                            <span className="text-xs font-medium" style={{ color: meta.color }}>
                              {meta.name}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
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
                          <td className="py-2 pr-4 font-mono">${p.entryPrice.toFixed(4)}</td>
                          <td className="py-2 pr-4 font-mono">${p.exitPrice.toFixed(4)}</td>
                          <td
                            className={`py-2 pr-4 font-mono font-semibold ${
                              p.pnlUsdc >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {p.pnlUsdc >= 0 ? "+" : ""}
                            {fmtUsd(p.pnlUsdc)}
                          </td>
                          <td className="py-2 pr-4 text-[#8b9cb3]">{p.holdTimeHours.toFixed(1)}h</td>
                          <td className="py-2 text-[#8b9cb3]">
                            {new Date(p.closedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Engine Health */}
        <section className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
          <h2 className="text-sm font-semibold text-[#e8edf5]">Engine Health</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Last Scan",    value: health ? timeAgo(health.lastScan)    : "—" },
              { label: "Last NAV Sync", value: health ? timeAgo(health.lastNavSync)  : "—" },
              { label: "RPC Provider", value: health?.rpcProvider ?? "—" },
              { label: "Data Age",     value: data  ? timeAgo(data.lastUpdatedAt)  : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-white/5 bg-[#080c14]/60 p-3">
                <div className="text-[10px] uppercase tracking-wider text-[#8b9cb3]">{label}</div>
                <div className="mt-1 text-sm font-semibold text-[#e8edf5]">{value}</div>
              </div>
            ))}
          </div>

          {data && vaultEntries.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {vaultEntries.map(([vaultId, vp]) => {
                const meta       = VAULT_META[vaultId] ?? { name: vaultId, color: "#8b9cb3" };
                const openCount  = Math.max(0, vp.totalOpened - vp.stats.won - vp.stats.lost);
                return (
                  <div key={vaultId} className="rounded-lg border border-white/5 bg-[#080c14]/60 p-3">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: meta.color }}
                    >
                      {meta.name}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#e8edf5]">
                      {openCount} open · {vp.closedPositions.length} closed
                    </div>
                    <div className="mt-0.5 text-xs text-[#8b9cb3]">
                      {vp.totalOpened} total opened
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
