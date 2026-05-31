import fs from "node:fs/promises";
import path from "node:path";
import { createLogger } from "./logger.js";
import type { ActivePosition } from "../types/index.js";

const log = createLogger("position-store");

function storePath(): string {
  const dir = process.env.VAULT_NAV_SNAPSHOT_DIR?.trim() || path.join(process.cwd(), "data");
  return path.join(dir, "positions.json");
}

export async function persistPositions(positions: Map<string, ActivePosition[]>): Promise<void> {
  try {
    const file = storePath();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const data: Record<string, ActivePosition[]> = {};
    for (const [key, val] of positions.entries()) {
      data[key] = val;
    }
    await fs.writeFile(
      file,
      JSON.stringify({ savedAt: new Date().toISOString(), positions: data }, null, 2),
      "utf-8",
    );
  } catch (err) {
    log.warn("Failed to persist positions (non-fatal)", err);
  }
}

export async function loadPersistedPositions(): Promise<Map<string, ActivePosition[]>> {
  const result = new Map<string, ActivePosition[]>();
  try {
    const file = storePath();
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as {
      savedAt?: string;
      positions?: Record<string, ActivePosition[]>;
    };
    if (parsed.positions && typeof parsed.positions === "object") {
      for (const [key, val] of Object.entries(parsed.positions)) {
        if (Array.isArray(val)) result.set(key, val);
      }
      const total = Array.from(result.values()).reduce((s, p) => s + p.length, 0);
      log.info(`Loaded ${total} persisted position(s) across ${result.size} vault(s) from ${file}`);
    }
  } catch {
    log.info("No persisted positions found — starting fresh");
  }
  return result;
}
