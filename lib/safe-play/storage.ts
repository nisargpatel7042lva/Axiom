import type { StoredSafePlayAck } from "./types";

const STORAGE_KEY = "spectra_safe_play_ack_v1";

export type AckStore = Record<string, StoredSafePlayAck>;

function readAll(): AckStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AckStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(store: AckStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function readStoredAck(walletAddress: string): StoredSafePlayAck | null {
  const all = readAll();
  const row = all[walletAddress];
  return row ?? null;
}

export function persistAcknowledgment(row: StoredSafePlayAck): void {
  const all = readAll();
  all[row.publicKey] = row;
  writeAll(all);
}
