import fs from "node:fs/promises";
import path from "node:path";
import { createLogger } from "./logger.js";
import type { ActivePosition } from "../types/index.js";

const log = createLogger("position-store");

// ─── Paths ────────────────────────────────────────────────────────────────────

function dataDir(): string {
  return process.env.VAULT_NAV_SNAPSHOT_DIR?.trim() || path.join(process.cwd(), "data");
}
const storePath  = () => path.join(dataDir(), "positions.json");
const backupPath = () => path.join(dataDir(), "positions.backup.json");
const lockPath   = () => path.join(dataDir(), "positions.lock");
const tmpPath    = () => path.join(dataDir(), "positions.tmp");

// ─── Advisory file lock ───────────────────────────────────────────────────────
// Uses O_EXCL for atomic creation (POSIX guarantee).
// Treats locks older than 30 s as stale and removes them automatically.

type ReleaseFn = () => Promise<void>;

async function acquireLock(timeoutMs = 8_000): Promise<ReleaseFn> {
  const lock = lockPath();
  const deadline = Date.now() + timeoutMs;

  while (true) {
    try {
      const fh = await fs.open(lock, "wx");
      await fh.writeFile(process.pid.toString(), "utf-8");
      await fh.close();
      return async () => { try { await fs.unlink(lock); } catch { /* already released */ } };
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;

      // Remove stale locks (engine crashed without releasing)
      try {
        const { mtimeMs } = await fs.stat(lock);
        if (Date.now() - mtimeMs > 30_000) {
          log.warn(`Removing stale lock file (age ${Math.round((Date.now() - mtimeMs) / 1000)}s)`);
          await fs.unlink(lock);
          continue;
        }
      } catch { /* lock vanished between EEXIST and stat — retry */ }

      if (Date.now() >= deadline) {
        throw new Error(`Could not acquire position store lock within ${timeoutMs}ms`);
      }
      await new Promise<void>((r) => setTimeout(r, 50));
    }
  }
}

// ─── File format ──────────────────────────────────────────────────────────────

interface PositionFile {
  savedAt: string;
  lastUpdatedAt: string;
  positions: Record<string, ActivePosition[]>;
}

function parsePositionFile(raw: string): PositionFile {
  const parsed = JSON.parse(raw) as Partial<PositionFile>;
  if (!parsed.positions || typeof parsed.positions !== "object") {
    throw new Error("Missing or invalid positions field");
  }
  return parsed as PositionFile;
}

// ─── Persist ──────────────────────────────────────────────────────────────────

export async function persistPositions(positions: Map<string, ActivePosition[]>): Promise<void> {
  const release = await acquireLock().catch((err) => {
    log.warn("Failed to acquire lock — skipping persist", err);
    return null;
  });
  if (!release) return;

  try {
    await fs.mkdir(dataDir(), { recursive: true });

    // Write backup of the current file before overwriting it
    try {
      await fs.copyFile(storePath(), backupPath());
    } catch (err: unknown) {
      // ENOENT is normal on the very first write — no existing file to back up
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        log.warn("Could not write backup — proceeding anyway", err);
      }
    }

    // Build payload
    const now = new Date().toISOString();
    const data: Record<string, ActivePosition[]> = {};
    for (const [key, val] of positions.entries()) data[key] = val;

    const payload: PositionFile = {
      savedAt: now,
      lastUpdatedAt: now,
      positions: data,
    };

    // Write to temp file then rename atomically (prevents partial reads)
    await fs.writeFile(tmpPath(), JSON.stringify(payload, null, 2), "utf-8");
    await fs.rename(tmpPath(), storePath());
  } catch (err) {
    log.warn("Failed to persist positions (non-fatal)", err);
    try { await fs.unlink(tmpPath()); } catch { /* best-effort cleanup */ }
  } finally {
    await release();
  }
}

// ─── Load (with backup recovery) ──────────────────────────────────────────────

function populateMap(
  parsed: PositionFile,
  result: Map<string, ActivePosition[]>,
): number {
  let total = 0;
  for (const [key, val] of Object.entries(parsed.positions)) {
    if (Array.isArray(val)) {
      result.set(key, val);
      total += val.length;
    }
  }
  return total;
}

export async function loadPersistedPositions(): Promise<Map<string, ActivePosition[]>> {
  const result = new Map<string, ActivePosition[]>();

  // 1. Try primary file
  try {
    const raw = await fs.readFile(storePath(), "utf-8");
    const parsed = parsePositionFile(raw);
    populateMap(parsed, result);
    return result;
  } catch (primaryErr: unknown) {
    const code = (primaryErr as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      // Normal on first run — fall through to try the backup silently
    } else {
      log.warn(
        `positions.json unreadable (${(primaryErr as Error).message}) — attempting backup recovery`,
      );
    }
  }

  // 2. Recover from backup
  try {
    const raw = await fs.readFile(backupPath(), "utf-8");
    const parsed = parsePositionFile(raw);
    const total = populateMap(parsed, result);
    log.warn(
      `Recovered ${total} position(s) across ${result.size} vault(s) from backup` +
      (parsed.lastUpdatedAt ? ` (last updated ${parsed.lastUpdatedAt})` : ""),
    );
    return result;
  } catch {
    // Both files missing or corrupt — fresh start
  }

  return result;
}
