"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Zap, Database, Activity } from "lucide-react";
import type { SimWebhookEvent } from "@/app/api/webhooks/dune-sim/route";

import { Topbar } from "@/components/layout/Topbar";
import { formatUsd } from "@/components/format";
import {
  getEngineTransparency,
  type EngineTransparencyResponse,
} from "@/lib/services/engine-transparency";
import { getNetwork } from "@/lib/spectra/constants";

function timeAgo(ts: string | null): string {
  if (!ts) return "Never";
  const ms = Date.now() - Date.parse(ts);
  if (!Number.isFinite(ms)) return "Unknown";
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtBps(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)} bps`;
}

function byNewest<T extends { timestamp: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

function solscanTx(sig: string): string {
  const n = getNetwork();
  const suffix = n === "mainnet-beta" ? "" : `?cluster=${n}`;
  return `https://solscan.io/tx/${sig}${suffix}`;
}

export default function TransparencyPage() {
  const [vaultFilter, setVaultFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [windowFilter, setWindowFilter] = useState<"1h" | "24h" | "7d" | "all">("24h");

  const q = useQuery<EngineTransparencyResponse>({
    queryKey: ["engine-transparency"],
    queryFn: getEngineTransparency,
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  const webhookQ = useQuery<{ events: SimWebhookEvent[]; total: number; description: string }>({
    queryKey: ["dune-sim-webhooks"],
    queryFn: () => fetch("/api/webhooks/dune-sim").then((r) => r.json()),
    refetchInterval: 8_000,
    staleTime: 5_000,
  });

  const data = q.data;
  const navRows = useMemo(
    () => (data ? [...data.navs].sort((a, b) => a.vaultId.localeCompare(b.vaultId)) : []),
    [data],
  );
  const now = Date.now();
  const cutoffMs =
    windowFilter === "1h"
      ? now - 60 * 60 * 1000
      : windowFilter === "24h"
        ? now - 24 * 60 * 60 * 1000
        : windowFilter === "7d"
          ? now - 7 * 24 * 60 * 60 * 1000
          : 0;
  const trades = useMemo(() => {
    if (!data) return [];
    return byNewest(data.trades)
      .filter((t) => (vaultFilter === "all" ? true : t.vaultId === vaultFilter))
      .filter((t) => (actionFilter === "all" ? true : t.action === actionFilter))
      .filter((t) => (cutoffMs === 0 ? true : Date.parse(t.timestamp) >= cutoffMs))
      .slice(0, 50);
  }, [data, vaultFilter, actionFilter, cutoffMs]);
  const decisions = useMemo(() => {
    if (!data) return [];
    return byNewest(data.decisions)
      .filter((d) => (vaultFilter === "all" ? true : d.vaultId === vaultFilter))
      .filter((d) => (actionFilter === "all" ? true : d.action.includes(actionFilter)))
      .filter((d) => (cutoffMs === 0 ? true : Date.parse(d.timestamp) >= cutoffMs))
      .slice(0, 50);
  }, [data, vaultFilter, actionFilter, cutoffMs]);
  const degradedVaults = navRows.filter((n) => n.dataQuality === "degraded").length;
  const degradedCauseCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const row of navRows) {
      for (const c of row.degradedCauses ?? []) {
        out[c] = (out[c] ?? 0) + 1;
      }
    }
    return out;
  }, [navRows]);
  const vaultOptions = useMemo(
    () => ["all", ...(data?.vaults.map((v) => v.strategyType) ?? [])],
    [data],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Topbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 pb-8 pt-[5.75rem] min-[391px]:px-4 min-[391px]:pt-[6rem] md:px-6 md:pb-10">
        <div className="flex flex-col gap-2 min-[391px]:gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-[#e8edf5] min-[391px]:text-2xl md:text-3xl">
              Transparency Dashboard
            </h1>
            {/* RPC Fast attribution badge */}
            <div className="flex flex-wrap items-center gap-2">
            {data?.health.rpcProvider === "rpcfast" ? (
              <div className="flex items-center gap-2 rounded-full border border-[#00e5c3]/30 bg-[#00e5c3]/10 px-3 py-1.5">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00e5c3] opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[#00e5c3]" />
                </span>
                <span className="text-xs font-semibold text-[#00e5c3]">Powered by RPC Fast</span>
                {data.health.rpcFastStreamActive && (
                  <span className="rounded-full bg-[#00e5c3]/20 px-1.5 py-0.5 text-xs font-medium text-[#00e5c3]">
                    WS Stream Active
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="size-1.5 rounded-full bg-[#8b9cb3]" />
                <span className="text-xs text-[#8b9cb3]">Public RPC</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f59e0b] opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#f59e0b]" />
              </span>
              <span className="text-xs font-semibold text-[#f59e0b]">Dune SIM Live</span>
            </div>
          </div>
          </div>
          <p className="max-w-3xl text-sm text-[#8b9cb3]">
            Live engine decisions, trade execution quality, and NAV reconciliation. If any data path degrades,
            it is shown here instead of hidden.
          </p>
        </div>

        {q.error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {(q.error as Error).message}
          </div>
        )}

        <motion.div className="mt-6 grid grid-cols-1 gap-3 min-[391px]:gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4">
            <div className="text-xs uppercase tracking-wider text-[#8b9cb3]">Last scan</div>
            <div className="mt-2 text-sm font-semibold text-[#e8edf5]">
              {data ? timeAgo(data.health.lastScan) : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4">
            <div className="text-xs uppercase tracking-wider text-[#8b9cb3]">Last NAV sync</div>
            <div className="mt-2 text-sm font-semibold text-[#e8edf5]">
              {data ? timeAgo(data.health.lastNavSync) : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4">
            <div className="text-xs uppercase tracking-wider text-[#8b9cb3]">Vaults degraded</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#e8edf5]">
              {degradedVaults > 0 ? (
                <AlertTriangle className="size-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-400" />
              )}
              {data ? `${degradedVaults} / ${data.navs.length}` : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-[#1a2235] bg-[#0d1420] p-4">
            <div className="text-xs uppercase tracking-wider text-[#8b9cb3]">Snapshot age</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#e8edf5]">
              <RefreshCw className={`size-4 ${q.isFetching ? "animate-spin text-[#00e5c3]" : "text-[#8b9cb3]"}`} />
              {data ? timeAgo(data.generatedAt) : "—"}
            </div>
          </div>
        </motion.div>

        <section className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm font-semibold text-[#e8edf5]">Filters</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                value={vaultFilter}
                onChange={(e) => setVaultFilter(e.target.value)}
                className="rounded-lg border border-[#1a2235] bg-[#080c14] px-3 py-2 text-xs text-[#e8edf5]"
              >
                {vaultOptions.map((v) => (
                  <option key={v} value={v}>
                    {v === "all" ? "All vaults" : v}
                  </option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="rounded-lg border border-[#1a2235] bg-[#080c14] px-3 py-2 text-xs text-[#e8edf5]"
              >
                <option value="all">All actions</option>
                <option value="open">Open</option>
                <option value="close">Close</option>
                <option value="harvest">Harvest</option>
                <option value="scan">Scan events</option>
                <option value="skip">Skipped entries</option>
              </select>
              <select
                value={windowFilter}
                onChange={(e) => setWindowFilter(e.target.value as typeof windowFilter)}
                className="rounded-lg border border-[#1a2235] bg-[#080c14] px-3 py-2 text-xs text-[#e8edf5]"
              >
                <option value="1h">Last 1h</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7d</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
          <h2 className="text-sm font-semibold text-[#e8edf5]">NAV Reconciliation</h2>
          <p className="mt-1 text-xs text-[#8b9cb3]">
            Computed NAV is compared with synced on-chain redeemable NAV. Delta and status are shown per vault.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="text-[#8b9cb3]">
                <tr>
                  <th className="pb-2 font-medium">Vault</th>
                  <th className="pb-2 font-medium">Predictions</th>
                  <th className="pb-2 font-medium">Lend</th>
                  <th className="pb-2 font-medium">Idle</th>
                  <th className="pb-2 font-medium">Computed NAV</th>
                  <th className="pb-2 font-medium">Synced NAV</th>
                  <th className="pb-2 font-medium">Delta</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Degraded causes</th>
                </tr>
              </thead>
              <tbody>
                {navRows.map((row) => (
                  <tr key={row.vaultId} className="border-t border-white/5 text-[#e8edf5]">
                    <td className="py-2">{row.vaultId}</td>
                    <td className="py-2">{formatUsd(row.predictionPositionsValue)}</td>
                    <td className="py-2">{formatUsd(row.lendingBalance)}</td>
                    <td className="py-2">{formatUsd(row.idleUsdc)}</td>
                    <td className="py-2">{formatUsd(row.totalNav)}</td>
                    <td className="py-2">{formatUsd(row.syncedNav)}</td>
                    <td className="py-2">{formatUsd(row.navDelta)}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          row.dataQuality === "verified"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {row.dataQuality}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-[#8b9cb3]">
                      {row.degradedCauses.length > 0 ? row.degradedCauses.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
                {navRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-3 text-[#8b9cb3]">
                      No NAV rows yet. Start engine and wait for first sync cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
          <h2 className="text-sm font-semibold text-[#e8edf5]">Degraded Causes Breakdown</h2>
          <p className="mt-1 text-xs text-[#8b9cb3]">
            Breakdown by root cause to separate data fallback from intentional liquidity-only sync.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/5 bg-[#080c14]/60 p-3">
              <div className="text-xs text-[#8b9cb3]">Prediction API fallback</div>
              <div className="mt-1 text-lg font-semibold text-[#e8edf5]">
                {degradedCauseCounts.prediction_api_fallback ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-white/5 bg-[#080c14]/60 p-3">
              <div className="text-xs text-[#8b9cb3]">Liquidity sync delta</div>
              <div className="mt-1 text-lg font-semibold text-[#e8edf5]">
                {degradedCauseCounts.liquidity_sync_delta ?? 0}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
            <h2 className="text-sm font-semibold text-[#e8edf5]">Recent Decisions</h2>
            <p className="mt-1 text-xs text-[#8b9cb3]">Why the engine acted or skipped opportunities.</p>
            <div className="mt-3 space-y-2">
              {decisions.map((d) => (
                <div key={`${d.timestamp}-${d.marketId ?? "scan"}`} className="rounded-lg border border-white/5 bg-[#080c14]/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-[#e8edf5]">{d.action}</div>
                    <div className="text-xs text-[#8b9cb3]">{new Date(d.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-xs text-[#8b9cb3]">{d.title}</div>
                  <div className="mt-1 text-xs text-[#c9d4e5]">
                    Reason: <span className="text-[#e8edf5]">{d.reasonCode}</span>
                    {d.score != null ? ` · Score ${d.score.toFixed(2)}` : ""}
                    {d.confidence != null ? ` · Confidence ${d.confidence}` : ""}
                  </div>
                  {d.details ? <div className="mt-1 text-xs text-[#8b9cb3]">{d.details}</div> : null}
                </div>
              ))}
              {decisions.length === 0 && (
                <p className="text-xs text-[#8b9cb3]">No decision rows for the selected filter.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#1a2235] bg-[#0d1420] p-4 min-[391px]:p-6">
            <h2 className="text-sm font-semibold text-[#e8edf5]">Execution Quality</h2>
            <p className="mt-1 text-xs text-[#8b9cb3]">Expected vs filled prices with slippage and reasons.</p>
            <div className="mt-3 space-y-2">
              {trades.map((t) => (
                <div key={`${t.timestamp}-${t.marketId}-${t.action}`} className="rounded-lg border border-white/5 bg-[#080c14]/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-[#e8edf5]">
                      {t.action} · {t.vaultId}
                    </div>
                    <div className="text-xs text-[#8b9cb3]">{new Date(t.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-xs text-[#c9d4e5]">
                    Market: {t.marketId} · Side: {t.side.toUpperCase()} · Amount: {formatUsd(t.amount)}
                  </div>
                  <div className="mt-1 text-xs text-[#c9d4e5]">
                    Expected {t.expectedPrice?.toFixed(4) ?? "—"} · Filled {t.filledPrice?.toFixed(4) ?? "—"} ·
                    Slippage {fmtBps(t.slippageBps)}
                  </div>
                  <div className="mt-1 text-xs text-[#8b9cb3]">
                    {t.reasonCode ?? "no-reason"} {t.txSignature ? `· ${t.txSignature.slice(0, 12)}...` : "· no tx"}
                    {t.txSignature && (
                      <Link
                        href={solscanTx(t.txSignature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-[#00e5c3] hover:underline"
                      >
                        Solscan
                        <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {trades.length === 0 && (
                <p className="text-xs text-[#8b9cb3]">No trade rows for the selected filter.</p>
              )}
            </div>
          </section>
        </div>

        {/* Dune SIM Data Intelligence */}
        <section className="mt-6 rounded-2xl border border-[#f59e0b]/20 bg-[#0d1420] p-4 min-[391px]:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Database className="size-4 text-[#f59e0b]" />
                <h2 className="text-sm font-semibold text-[#e8edf5]">Dune SIM Data Intelligence</h2>
              </div>
              <p className="mt-1 text-xs text-[#8b9cb3]">
                Real-time on-chain data via Dune SIM — wallet balances, transaction history, and live webhook events power the Axiom Vaults UX.
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2.5 py-1 shrink-0">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f59e0b] opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#f59e0b]" />
              </span>
              <span className="text-xs font-semibold text-[#f59e0b]">Live</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#f59e0b]/10 bg-[#080c14]/60 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="size-3.5 text-[#f59e0b]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#f59e0b]">
                  Balances
                </span>
              </div>
              <div className="font-mono text-xs text-[#8b9cb3]">GET /beta/svm/balances/</div>
              <p className="mt-1.5 text-xs text-[#c9d4e5]">
                Full SPL token portfolio for connected wallets. Powers the Token Holdings table and the Deposit Modal USDC balance display.
              </p>
            </div>
            <div className="rounded-xl border border-[#f59e0b]/10 bg-[#080c14]/60 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="size-3.5 text-[#f59e0b]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#f59e0b]">
                  Transactions
                </span>
              </div>
              <div className="font-mono text-xs text-[#8b9cb3]">GET /beta/svm/transactions/</div>
              <p className="mt-1.5 text-xs text-[#c9d4e5]">
                Recent wallet transactions parsed with log inspection. Feeds the Vault Activity Feed and the 15-day portfolio USDC flow chart.
              </p>
            </div>
            <div className="rounded-xl border border-[#f59e0b]/10 bg-[#080c14]/60 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="size-3.5 text-[#f59e0b]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#f59e0b]">
                  Webhooks
                </span>
              </div>
              <div className="font-mono text-xs text-[#8b9cb3]">POST /api/webhooks/dune-sim</div>
              <p className="mt-1.5 text-xs text-[#c9d4e5]">
                Real-time push receiver. Register this endpoint in Dune SIM Subscriptions to stream transaction events directly into Axiom Vaults without polling.
              </p>
            </div>
          </div>

          {/* Webhook live event log */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#e8edf5]">Webhook Event Log</h3>
              <div className="flex items-center gap-1.5 text-xs text-[#8b9cb3]">
                <RefreshCw className={`size-3 ${webhookQ.isFetching ? "animate-spin text-[#f59e0b]" : ""}`} />
                {webhookQ.data ? `${webhookQ.data.total} events total` : "Polling…"}
              </div>
            </div>
            {webhookQ.data && webhookQ.data.events.length > 0 ? (
              <div className="space-y-1.5">
                {webhookQ.data.events.slice(0, 8).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-[#080c14]/60 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f59e0b]/15 px-1.5 py-0.5 text-xs font-medium text-[#f59e0b]">
                          {ev.eventType}
                        </span>
                        <span className="text-xs text-[#8b9cb3]">{ev.chain}</span>
                        {ev.walletAddress && (
                          <span className="font-mono text-xs text-[#8b9cb3]">
                            {ev.walletAddress.slice(0, 6)}…{ev.walletAddress.slice(-4)}
                          </span>
                        )}
                      </div>
                      {ev.txHash && (
                        <div className="mt-0.5 font-mono text-xs text-[#8b9cb3]">
                          tx: {ev.txHash.slice(0, 16)}…
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-xs text-[#8b9cb3]">
                      {new Date(ev.receivedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#f59e0b]/20 bg-[#080c14]/40 px-4 py-5 text-center">
                <Zap className="mx-auto mb-2 size-5 text-[#f59e0b]/40" />
                <p className="text-xs text-[#8b9cb3]">
                  No webhook events received yet.
                </p>
                <p className="mt-1 text-xs text-[#8b9cb3]/70">
                  Register{" "}
                  <span className="font-mono text-[#f59e0b]/70">{"<your-domain>"}/api/webhooks/dune-sim</span>{" "}
                  in the Dune SIM dashboard under Subscriptions → Webhooks to push real-time transaction events here.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

