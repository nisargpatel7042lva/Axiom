export type PortfolioActivityType = "deposit" | "withdraw";

export type PortfolioActivity = {
  id: string;
  wallet: string;
  vaultId: string;
  vaultName: string;
  ticker: string;
  kind: PortfolioActivityType;
  amountUsdc: number;
  txSig?: string;
  timestamp: number;
};

const STORAGE_KEY = "spectra_portfolio_activity_v1";
export const PORTFOLIO_ACTIVITY_EVENT = "spectra:portfolio-activity-updated";

function readRaw(): PortfolioActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PortfolioActivity[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e === "object");
  } catch {
    return [];
  }
}

function writeRaw(rows: PortfolioActivity[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function emitUpdate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PORTFOLIO_ACTIVITY_EVENT));
}

export function listPortfolioActivities(wallet: string): PortfolioActivity[] {
  return readRaw()
    .filter((e) => e.wallet === wallet)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function recordPortfolioActivity(
  entry: Omit<PortfolioActivity, "id" | "timestamp"> & { timestamp?: number },
): PortfolioActivity {
  const next: PortfolioActivity = {
    ...entry,
    id: `${entry.wallet}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: entry.timestamp ?? Date.now(),
  };

  const prev = readRaw();
  const merged = [...prev, next].slice(-2000);
  writeRaw(merged);
  emitUpdate();
  return next;
}
