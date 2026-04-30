import type { DuneTransaction } from "./dune-sim";

type HeliusParsedTx = {
  signature?: string;
  slot?: number;
  timestamp?: number;
  feePayer?: string;
  source?: string;
  type?: string;
  description?: string;
};

function apiBaseFromRpc(rpcUrl: string): string | null {
  try {
    const u = new URL(rpcUrl);
    const host = u.host.toLowerCase();
    if (host.includes("devnet.helius-rpc.com")) return "https://api-devnet.helius-rpc.com";
    if (host.includes("mainnet.helius-rpc.com")) return "https://api.helius-rpc.com";
    return null;
  } catch {
    return null;
  }
}

function apiKeyFromRpc(rpcUrl: string): string | null {
  try {
    const u = new URL(rpcUrl);
    return u.searchParams.get("api-key");
  } catch {
    return null;
  }
}

function decodeNameFromParsed(tx: HeliusParsedTx): string {
  const raw = `${tx.type ?? ""} ${tx.source ?? ""} ${tx.description ?? ""}`.toLowerCase();
  if (raw.includes("deposit")) return "deposit";
  if (raw.includes("withdraw")) return "withdraw";
  if (raw.includes("swap") || raw.includes("trade")) return "swap";
  if (raw.includes("sync") && raw.includes("nav")) return "sync_nav";
  return tx.type?.toLowerCase() || tx.source?.toLowerCase() || "helius_tx";
}

function mapHeliusTx(tx: HeliusParsedTx): DuneTransaction {
  const ts = typeof tx.timestamp === "number" ? tx.timestamp * 1000 : Date.now();
  return {
    hash: tx.signature ?? `slot-${tx.slot ?? 0}`,
    block_number: tx.slot ?? 0,
    block_time: new Date(ts).toISOString(),
    from: tx.feePayer ?? "",
    to: "",
    value: "0",
    success: true,
    transaction_type: "svm",
    decoded: {
      name: decodeNameFromParsed(tx),
      inputs: {},
    },
  };
}

export async function getHeliusParsedTransactionHistory(
  address: string,
  rpcUrl: string,
  limit = 20,
): Promise<DuneTransaction[]> {
  const base = apiBaseFromRpc(rpcUrl);
  const key = apiKeyFromRpc(rpcUrl);
  if (!base || !key) return [];

  try {
    const url = `${base}/v0/addresses/${encodeURIComponent(address)}/transactions/?api-key=${encodeURIComponent(key)}&limit=${Math.max(1, Math.min(limit, 100))}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapHeliusTx(row as HeliusParsedTx));
  } catch {
    return [];
  }
}
