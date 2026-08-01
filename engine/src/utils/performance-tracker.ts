import fs from "node:fs/promises";
import path from "node:path";
import { createLogger } from "./logger.js";
import type { ActivePosition, NavBreakdown } from "../types/index.js";

const log = createLogger("performance-tracker");

const MAX_PPS_HISTORY    = 1_000; // per vault — enough for any dashboard window
const MAX_CLOSED_HISTORY = 500;   // per vault — keeps file size bounded

// ─── Public types (consumed by the API layer) ─────────────────────────────────

export interface PpsSnapshot {
  timestamp: string;
  pps: number;
  totalNav: number;
  predictionPositionsValue: number;
  lendingBalance: number;
  idleUsdc: number;
}

export interface ClosedPositionRecord {
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

export interface VaultStats {
  totalOpened: number;
  won: number;
  lost: number;
  winRatePct: number;
  totalRealizedPnlUsdc: number;
  avgHoldTimeHours: number;
}

export interface VaultPerformance {
  ppsHistory: PpsSnapshot[];
  closedPositions: ClosedPositionRecord[];
  totalOpened: number;
  stats: VaultStats;
}

export interface PerformanceData {
  lastUpdatedAt: string;
  vaults: Record<string, VaultPerformance>;
}

// ─── Paths ────────────────────────────────────────────────────────────────────

function dataDir(): string {
  return process.env.VAULT_NAV_SNAPSHOT_DIR?.trim() || path.join(process.cwd(), "data");
}
const perfPath     = () => path.join(dataDir(), "performance.json");
const perfTmpPath  = () => path.join(dataDir(), "performance.tmp");
const perfLockPath = () => path.join(dataDir(), "performance.lock");

// ─── Advisory file lock ───────────────────────────────────────────────────────

type ReleaseFn = () => Promise<void>;

async function acquireLock(timeoutMs = 8_000): Promise<ReleaseFn> {
  const lock = perfLockPath();
  const deadline = Date.now() + timeoutMs;

  while (true) {
    try {
      const fh = await fs.open(lock, "wx");
      await fh.writeFile(process.pid.toString(), "utf-8");
      await fh.close();
      return async () => { try { await fs.unlink(lock); } catch { /* already released */ } };
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;

      try {
        const { mtimeMs } = await fs.stat(lock);
        if (Date.now() - mtimeMs > 30_000) {
          log.warn(`Removing stale performance lock (age ${Math.round((Date.now() - mtimeMs) / 1000)}s)`);
          await fs.unlink(lock);
          continue;
        }
      } catch { /* lock vanished — retry */ }

      if (Date.now() >= deadline) {
        throw new Error(`Could not acquire performance lock within ${timeoutMs}ms`);
      }
      await new Promise<void>((r) => setTimeout(r, 50));
    }
  }
}

// ─── In-memory state ──────────────────────────────────────────────────────────

const state = new Map<string, VaultPerformance>();
let persistDebounce: NodeJS.Timeout | null = null;

function getOrCreate(vaultId: string): VaultPerformance {
  if (!state.has(vaultId)) {
    state.set(vaultId, {
      ppsHistory: [],
      closedPositions: [],
      totalOpened: 0,
      stats: {
        totalOpened: 0,
        won: 0,
        lost: 0,
        winRatePct: 0,
        totalRealizedPnlUsdc: 0,
        avgHoldTimeHours: 0,
      },
    });
  }
  return state.get(vaultId)!;
}

function recomputeStats(vp: VaultPerformance): void {
  const closed = vp.closedPositions;
  const won  = closed.filter((p) => p.outcome === "won").length;
  const lost = closed.filter((p) => p.outcome === "lost").length;
  const totalRealizedPnlUsdc = closed.reduce((s, p) => s + p.pnlUsdc, 0);
  const avgHoldTimeHours =
    closed.length > 0
      ? closed.reduce((s, p) => s + p.holdTimeHours, 0) / closed.length
      : 0;

  vp.stats = {
    totalOpened: vp.totalOpened,
    won,
    lost,
    winRatePct: closed.length > 0 ? parseFloat(((won / closed.length) * 100).toFixed(2)) : 0,
    totalRealizedPnlUsdc: parseFloat(totalRealizedPnlUsdc.toFixed(4)),
    avgHoldTimeHours: parseFloat(avgHoldTimeHours.toFixed(2)),
  };
}

// ─── Persist ──────────────────────────────────────────────────────────────────

async function persistPerformance(): Promise<void> {
  const release = await acquireLock().catch((err) => {
    log.warn("Failed to acquire performance lock — skipping persist", err);
    return null;
  });
  if (!release) return;

  try {
    await fs.mkdir(dataDir(), { recursive: true });

    const payload: PerformanceData = {
      lastUpdatedAt: new Date().toISOString(),
      vaults: Object.fromEntries(state.entries()),
    };

    await fs.writeFile(perfTmpPath(), JSON.stringify(payload, null, 2), "utf-8");
    await fs.rename(perfTmpPath(), perfPath());
  } catch (err) {
    log.warn("Failed to persist performance data (non-fatal)", err);
    try { await fs.unlink(perfTmpPath()); } catch { /* best-effort */ }
  } finally {
    await release();
  }
}

function schedulePersist(): void {
  if (persistDebounce) return;
  persistDebounce = setTimeout(() => {
    persistDebounce = null;
    void persistPerformance();
  }, 200);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initPerformanceTracker(): Promise<void> {
  try {
    const raw = await fs.readFile(perfPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<PerformanceData>;

    if (parsed.vaults && typeof parsed.vaults === "object") {
      for (const [vaultId, vp] of Object.entries(parsed.vaults)) {
        if (vp && typeof vp === "object") {
          state.set(vaultId, {
            ppsHistory:      Array.isArray(vp.ppsHistory)      ? vp.ppsHistory      : [],
            closedPositions: Array.isArray(vp.closedPositions) ? vp.closedPositions : [],
            totalOpened:     typeof vp.totalOpened === "number" ? vp.totalOpened     : 0,
            stats:           vp.stats ?? {
              totalOpened: 0, won: 0, lost: 0,
              winRatePct: 0, totalRealizedPnlUsdc: 0, avgHoldTimeHours: 0,
            },
          });
        }
      }

      const totalVaults    = state.size;
      const totalSnapshots = Array.from(state.values()).reduce((s, v) => s + v.ppsHistory.length, 0);
      const totalClosed    = Array.from(state.values()).reduce((s, v) => s + v.closedPositions.length, 0);
      log.info(
        `Performance tracker loaded — ${totalVaults} vault(s), ` +
        `${totalSnapshots} PPS snapshot(s), ${totalClosed} closed position(s)`,
      );
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      log.warn("performance.json unreadable — starting with empty history", err);
    } else {
      log.info("No performance history found — starting fresh");
    }
  }
}

// ─── Public write API ─────────────────────────────────────────────────────────

/** Called from nav-calculator after each vault NAV sync. */
export function recordPpsSnapshot(vaultId: string, nav: NavBreakdown): void {
  const vp = getOrCreate(vaultId);

  const snapshot: PpsSnapshot = {
    timestamp:                nav.timestamp,
    pps:                      nav.pricePerShare,
    totalNav:                 nav.totalNav,
    predictionPositionsValue: nav.predictionPositionsValue,
    lendingBalance:           nav.lendingBalance,
    idleUsdc:                 nav.idleUsdc,
  };

  vp.ppsHistory.push(snapshot);
  if (vp.ppsHistory.length > MAX_PPS_HISTORY) {
    vp.ppsHistory.splice(0, vp.ppsHistory.length - MAX_PPS_HISTORY);
  }

  schedulePersist();
}

/** Called from position-manager when a new position is recorded (open). */
export function recordPositionOpened(vaultId: string): void {
  const vp = getOrCreate(vaultId);
  vp.totalOpened += 1;
  vp.stats.totalOpened = vp.totalOpened;
  schedulePersist();
}

/** Called from position-manager when a position closes (harvest or strategy exit). */
export function recordClosedPosition(
  vaultId: string,
  pos: ActivePosition,
  exitPrice: number,
): void {
  const vp = getOrCreate(vaultId);

  const closedAt     = new Date().toISOString();
  const openedAtMs   = Date.parse(pos.openedAt);
  const holdTimeHours =
    Number.isFinite(openedAtMs)
      ? parseFloat(((Date.now() - openedAtMs) / 3_600_000).toFixed(2))
      : 0;

  const pnlUsdc  = parseFloat(((exitPrice - pos.avgEntryPrice) * pos.contracts).toFixed(4));
  const outcome: "won" | "lost" = pnlUsdc > 0 ? "won" : "lost";

  const record: ClosedPositionRecord = {
    marketId:      pos.marketId,
    title:         pos.title,
    side:          pos.side,
    entryPrice:    pos.avgEntryPrice,
    exitPrice,
    usdcDeployed:  pos.usdcDeployed,
    pnlUsdc,
    holdTimeHours,
    openedAt:      pos.openedAt,
    closedAt,
    outcome,
  };

  vp.closedPositions.push(record);
  if (vp.closedPositions.length > MAX_CLOSED_HISTORY) {
    vp.closedPositions.splice(0, vp.closedPositions.length - MAX_CLOSED_HISTORY);
  }

  recomputeStats(vp);
  schedulePersist();

  log.info(
    `[${vaultId}] Position closed — ${pos.title} | ` +
    `${pos.side.toUpperCase()} | entry $${pos.avgEntryPrice.toFixed(4)} → ` +
    `exit $${exitPrice.toFixed(4)} | PnL $${pnlUsdc.toFixed(2)} | ${outcome.toUpperCase()} | ` +
    `hold ${holdTimeHours}h`,
  );
}

// ─── Public read API ──────────────────────────────────────────────────────────

export function getPerformanceData(): PerformanceData {
  return {
    lastUpdatedAt: new Date().toISOString(),
    vaults: Object.fromEntries(state.entries()),
  };
}
