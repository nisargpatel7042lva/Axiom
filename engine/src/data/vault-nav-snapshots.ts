import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { CONFIG } from "../config.js";

const MS_PER_DAY = 86_400_000;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;
const WEEK_MS = 7 * MS_PER_DAY;
const MONTH_MS = 30 * MS_PER_DAY;

const MAX_SNAPSHOT_LINES = 50_000;

export interface VaultNavSnapshot {
  vaultId: number;
  timestamp: string;
  totalNav: number;
  pps: number;
  predictionsValue: number;
  lendValue: number;
  idleValue: number;
  feesAccrued: number;
}

export interface VaultNavYieldMetrics {
  vaultId: number;
  asOf: string;
  snapshotCount: number;
  weeklyAPY: number | null;
  monthlyAPY: number | null;
  inceptionAPY: number | null;
  rollingVolatility: number | null;
  windows: {
    weekly: { from: string | null; to: string | null; daysUsed: number | null };
    monthly: { from: string | null; to: string | null; daysUsed: number | null };
    inception: { from: string | null; to: string | null; daysUsed: number | null };
  };
}

function snapshotDir(): string {
  const override = CONFIG.VAULT_NAV_SNAPSHOT_DIR;
  if (override) return override;
  return join(process.cwd(), "data", "vault-nav-snapshots");
}

function snapshotPath(vaultId: number): string {
  return join(snapshotDir(), `vault-${vaultId}.jsonl`);
}

function yearsBetween(fromMs: number, toMs: number): number {
  return (toMs - fromMs) / MS_PER_YEAR;
}

export function annualizedApyFromPps(
  ppsStart: number,
  ppsEnd: number,
  fromMs: number,
  toMs: number,
): number | null {
  if (ppsStart <= 0 || ppsEnd <= 0 || toMs <= fromMs) return null;
  const years = yearsBetween(fromMs, toMs);
  if (years < 1 / (365.25 * 24 * 12)) return null;
  const ratio = ppsEnd / ppsStart;
  if (ratio <= 0) return null;
  return Math.pow(ratio, 1 / years) - 1;
}

function parseIsoMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

function baselineAtOrBefore(sorted: VaultNavSnapshot[], deadlineMs: number): VaultNavSnapshot {
  if (sorted.length === 0) {
    throw new Error("baselineAtOrBefore requires a non-empty series");
  }
  let lo = 0;
  let hi = sorted.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const t = parseIsoMs(sorted[mid]!.timestamp);
    if (!Number.isFinite(t)) {
      lo = mid + 1;
      continue;
    }
    if (t <= deadlineMs) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans >= 0 ? sorted[ans]! : sorted[0]!;
}

function sampleStdDev(values: number[]): number | null {
  const n = values.length;
  if (n < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  let sumSq = 0;
  for (const v of values) {
    const d = v - mean;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / (n - 1));
}

export function rollingVolatilityAnnualized(
  sorted: VaultNavSnapshot[],
  nowMs: number,
  windowMs: number = 60 * MS_PER_DAY,
): number | null {
  const fromMs = nowMs - windowMs;
  const inWindow = sorted.filter((s) => {
    const t = parseIsoMs(s.timestamp);
    return Number.isFinite(t) && t >= fromMs && t <= nowMs;
  });
  if (inWindow.length < 2) return null;

  const logReturns: number[] = [];
  const deltas: number[] = [];
  for (let i = 1; i < inWindow.length; i++) {
    const a = inWindow[i - 1]!;
    const b = inWindow[i]!;
    const ta = parseIsoMs(a.timestamp);
    const tb = parseIsoMs(b.timestamp);
    if (!Number.isFinite(ta) || !Number.isFinite(tb) || tb <= ta) continue;
    if (a.pps <= 0 || b.pps <= 0) continue;
    logReturns.push(Math.log(b.pps / a.pps));
    deltas.push(tb - ta);
  }
  if (logReturns.length < 2) return null;

  const sigma = sampleStdDev(logReturns);
  if (sigma === null || sigma === 0) return 0;

  const meanDt = deltas.reduce((x, y) => x + y, 0) / deltas.length;
  if (meanDt <= 0) return null;
  const periodsPerYear = MS_PER_YEAR / meanDt;
  return sigma * Math.sqrt(periodsPerYear);
}

export function computeYieldMetrics(
  snapshots: VaultNavSnapshot[],
  nowMs: number = Date.now(),
): VaultNavYieldMetrics {
  const valid = snapshots
    .filter(
      (s) =>
        Number.isFinite(s.pps) && s.pps > 0 && Number.isFinite(parseIsoMs(s.timestamp)),
    )
    .sort((a, b) => parseIsoMs(a.timestamp) - parseIsoMs(b.timestamp));

  const latest = valid[valid.length - 1];
  const vaultId = latest?.vaultId ?? (valid[0]?.vaultId ?? 0);

  if (!latest || valid.length < 2) {
    return {
      vaultId,
      asOf: new Date(nowMs).toISOString(),
      snapshotCount: valid.length,
      weeklyAPY: null,
      monthlyAPY: null,
      inceptionAPY: null,
      rollingVolatility: rollingVolatilityAnnualized(valid, nowMs),
      windows: {
        weekly: { from: null, to: latest?.timestamp ?? null, daysUsed: null },
        monthly: { from: null, to: latest?.timestamp ?? null, daysUsed: null },
        inception: { from: null, to: latest?.timestamp ?? null, daysUsed: null },
      },
    };
  }

  const first = valid[0]!;
  const tLatest = parseIsoMs(latest.timestamp);
  const tFirst = parseIsoMs(first.timestamp);

  const baseWeekly = baselineAtOrBefore(valid, tLatest - WEEK_MS);
  const baseMonthly = baselineAtOrBefore(valid, tLatest - MONTH_MS);

  const tw = parseIsoMs(baseWeekly.timestamp);
  const tm = parseIsoMs(baseMonthly.timestamp);

  const weeklyAPY =
    Number.isFinite(tw) && tLatest > tw
      ? annualizedApyFromPps(baseWeekly.pps, latest.pps, tw, tLatest)
      : null;

  const monthlyAPY =
    Number.isFinite(tm) && tLatest > tm
      ? annualizedApyFromPps(baseMonthly.pps, latest.pps, tm, tLatest)
      : null;

  const inceptionAPY =
    tFirst < tLatest
      ? annualizedApyFromPps(first.pps, latest.pps, tFirst, tLatest)
      : null;

  const daysWeekly =
    Number.isFinite(tw) && tLatest > tw ? (tLatest - tw) / MS_PER_DAY : null;
  const daysMonthly =
    Number.isFinite(tm) && tLatest > tm ? (tLatest - tm) / MS_PER_DAY : null;
  const daysInception =
    tFirst < tLatest ? (tLatest - tFirst) / MS_PER_DAY : null;

  return {
    vaultId,
    asOf: new Date(nowMs).toISOString(),
    snapshotCount: valid.length,
    weeklyAPY,
    monthlyAPY,
    inceptionAPY,
    rollingVolatility: rollingVolatilityAnnualized(valid, nowMs),
    windows: {
      weekly: {
        from: baseWeekly.timestamp,
        to: latest.timestamp,
        daysUsed: daysWeekly,
      },
      monthly: {
        from: baseMonthly.timestamp,
        to: latest.timestamp,
        daysUsed: daysMonthly,
      },
      inception: {
        from: first.timestamp,
        to: latest.timestamp,
        daysUsed: daysInception,
      },
    },
  };
}

export async function appendVaultNavSnapshot(row: VaultNavSnapshot): Promise<void> {
  const dir = snapshotDir();
  await mkdir(dir, { recursive: true });
  const path = snapshotPath(row.vaultId);
  const line = JSON.stringify(row) + "\n";
  await appendFile(path, line, "utf8");
}

export async function readVaultNavSnapshots(vaultId: number): Promise<VaultNavSnapshot[]> {
  const path = snapshotPath(vaultId);
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw e;
  }

  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const slice =
    lines.length > MAX_SNAPSHOT_LINES ? lines.slice(-MAX_SNAPSHOT_LINES) : lines;

  const out: VaultNavSnapshot[] = [];
  for (const line of slice) {
    try {
      const row = JSON.parse(line) as VaultNavSnapshot;
      if (
        typeof row.vaultId === "number" &&
        typeof row.pps === "number" &&
        typeof row.timestamp === "string"
      ) {
        out.push(row);
      }
    } catch {
      // skip corrupt line
    }
  }
  return out;
}

export async function getVaultNavYieldMetrics(vaultId: number): Promise<VaultNavYieldMetrics> {
  const snaps = await readVaultNavSnapshots(vaultId);
  return computeYieldMetrics(snaps);
}
