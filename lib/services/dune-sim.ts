import axios, { type AxiosInstance } from "axios";
import type { Connection, ParsedTransactionWithMeta } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import { IDL } from "@/lib/spectra/idl";
import { VAULT_CONFIGS } from "@/constants";
import { deriveVaultPda, deriveSharesMintPda } from "@/lib/spectra/vault-client";

let shareMintToVaultId: Map<string, string> | null = null;
function getVaultIdFromShareMint(mint: string): string | null {
  if (!shareMintToVaultId) {
    shareMintToVaultId = new Map();
    for (const cfg of VAULT_CONFIGS) {
      if (cfg.chainVaultId == null) continue;
      const [vaultPda] = deriveVaultPda(cfg.chainVaultId);
      const [sharesMint] = deriveSharesMintPda(vaultPda);
      shareMintToVaultId.set(sharesMint.toBase58().toLowerCase(), cfg.id);
    }
  }
  return shareMintToVaultId.get(mint.toLowerCase()) ?? null;
}

/** Sim SVM routes live under `/beta/svm`, not `/v1/.../solana/...`. */
const DUNE_SIM_BASE = "https://api.sim.dune.com";

/** Spectra vault program (IDL); override when testing a forked program. */
export function spectraVaultProgramId(): string {
  const env =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID?.trim()
      : undefined;
  return env || IDL.address;
}

function logsInvokeSpectraVault(
  logs: string[] | undefined,
  vaultProgramId: string,
): boolean {
  if (!logs?.length) return false;
  return logs.some((line) => line.includes(vaultProgramId));
}

/** Anchor-style: `Program log: Instruction: Deposit` — avoids matching Jupiter SPL withdraws. */
function hasSpectraLiquidityInstruction(logsLower: string): boolean {
  return (
    /\binstruction:\s*deposit\b/i.test(logsLower) ||
    /\binstruction:\s*withdraw\b/i.test(logsLower)
  );
}

/**
 * API key resolution:
 * - In the browser we only read `NEXT_PUBLIC_*` (everything else is stripped at build time).
 *   That means the Dune key is **public to visitors** if set that way — use only for local demos,
 *   or proxy Sim calls through a server Route Handler with `DUNE_SIM_API_KEY` instead.
 * - On the server, prefer `DUNE_SIM_API_KEY` (not public).
 */
function getApiKey(): string {
  const key =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_DUNE_SIM_API_KEY
      : process.env.DUNE_SIM_API_KEY ?? process.env.NEXT_PUBLIC_DUNE_SIM_API_KEY;
  return key ?? "";
}

function createClient(): AxiosInstance {
  return axios.create({
    baseURL: DUNE_SIM_BASE,
    timeout: 15_000,
    headers: {
      "X-Sim-Api-Key": getApiKey(),
    },
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenBalance {
  chain: string;
  address: string;
  amount: string;
  decimals: number;
  symbol: string;
  name: string;
  price_usd: number | null;
  value_usd: number | null;
  logo_url: string | null;
}

export interface DuneTransaction {
  hash: string;
  block_number: number;
  block_time: string;
  from: string;
  to: string;
  value: string;
  success: boolean;
  transaction_type: string;
  decoded: {
    name: string;
    inputs: Record<string, unknown>;
  } | null;
  raw_transaction?: SvmRawTransaction;
}

export interface DuneTokenInfo {
  address: string;
  chain: string;
  name: string;
  symbol: string;
  decimals: number;
  logo_url: string | null;
  price_usd: number | null;
  total_supply: string | null;
}

/** Response shape for `GET /beta/svm/balances/{address}` (see Sim docs). */
interface SvmBalanceItem {
  chain: string;
  address: string;
  amount: string;
  decimals?: number;
  symbol?: string;
  name?: string;
  price_usd?: number | null;
  value_usd?: number | null;
  uri?: string | null;
}

interface SvmBalancesResponse {
  balances?: SvmBalanceItem[];
}

/** Response shape for `GET /beta/svm/transactions/{address}`. */
interface SvmUiTokenAmount {
  amount?: string;
  decimals?: number;
  uiAmountString?: string;
}

interface SvmTokenBalanceRow {
  owner?: string;
  mint?: string;
  uiTokenAmount?: SvmUiTokenAmount;
}

interface SvmRawTransaction {
  meta?: {
    err?: unknown;
    logMessages?: string[];
    preTokenBalances?: SvmTokenBalanceRow[];
    postTokenBalances?: SvmTokenBalanceRow[];
  };
  transaction?: { signatures?: string[] };
}

interface SvmTransactionRow {
  address: string;
  block_slot: number;
  block_time: number;
  chain: string;
  raw_transaction?: SvmRawTransaction;
}

interface SvmTransactionsResponse {
  transactions?: SvmTransactionRow[];
}

function mapSvmBalanceToTokenBalance(b: SvmBalanceItem): TokenBalance {
  return {
    chain: b.chain,
    address: b.address,
    amount: b.amount,
    decimals: typeof b.decimals === "number" ? b.decimals : 9,
    symbol: b.symbol ?? "",
    name: b.name ?? "",
    price_usd: b.price_usd ?? null,
    value_usd: b.value_usd ?? null,
    logo_url: b.uri ?? null,
  };
}

function svmTxSuccess(meta: { err?: unknown } | undefined): boolean {
  const err = meta?.err;
  if (err === undefined || err === null) return true;
  if (typeof err === "object" && err !== null && "Ok" in err) return true;
  return false;
}

function inferIxFromLogs(
  logs: string[] | undefined,
  vaultProgramId: string,
): DuneTransaction["decoded"] {
  if (!logs?.length) return null;
  const blob = logs.join(" ").toLowerCase();
  const vault = logsInvokeSpectraVault(logs, vaultProgramId);

  if (vault && /\binstruction:\s*deposit\b/i.test(blob))
    return { name: "deposit", inputs: {} };
  if (vault && /\binstruction:\s*withdraw\b/i.test(blob))
    return { name: "withdraw", inputs: {} };
  if (
    vault &&
    (blob.includes("sync_nav") || blob.includes("sync nav"))
  ) {
    return { name: "sync_nav", inputs: {} };
  }
  // DeFi routes often log "withdraw"/"deposit" for SPL — classify as swap only when not a Spectra tx.
  if (blob.includes("swap") || blob.includes("jupiter"))
    return { name: "swap", inputs: {} };
  return null;
}

function mapSvmTransactionToDune(tx: SvmTransactionRow): DuneTransaction {
  const sig =
    tx.raw_transaction?.transaction?.signatures?.[0] ??
    `slot-${tx.block_slot}`;
  const ms = Math.floor(tx.block_time / 1000);
  const logs = tx.raw_transaction?.meta?.logMessages;
  const vaultProgramId = spectraVaultProgramId();
  return {
    hash: sig,
    block_number: tx.block_slot,
    block_time: Number.isFinite(ms) ? new Date(ms).toISOString() : "",
    from: tx.address,
    to: "",
    value: "0",
    success: svmTxSuccess(tx.raw_transaction?.meta),
    transaction_type: "svm",
    decoded: inferIxFromLogs(logs, vaultProgramId),
    raw_transaction: tx.raw_transaction,
  };
}

export type WalletUsdcFlow = {
  kind: "deposit" | "withdraw";
  amountUsdc: number;
  timestamp: number;
  txSig: string;
  vaultId?: string;
};

function tokenUiAmount(row: SvmTokenBalanceRow): number {
  const ui = row.uiTokenAmount;
  if (!ui) return 0;
  if (ui.uiAmountString != null) {
    const n = Number(ui.uiAmountString);
    return Number.isFinite(n) ? n : 0;
  }
  const amount = Number(ui.amount ?? "0");
  const decimals = Number(ui.decimals ?? 0);
  if (!Number.isFinite(amount) || !Number.isFinite(decimals)) return 0;
  return amount / 10 ** decimals;
}

/**
 * Infer USDC flow for one wallet from token-balance deltas inside a transaction.
 * Negative delta = wallet spent USDC (deposit), positive delta = wallet received USDC (withdraw).
 */
export function inferWalletUsdcFlow(
  tx: DuneTransaction,
  walletAddress: string,
  usdcMint: string,
): WalletUsdcFlow | null {
  if (!tx.success) return null;

  const logs = tx.raw_transaction?.meta?.logMessages ?? [];
  const vaultProgramId = spectraVaultProgramId();
  if (!logsInvokeSpectraVault(logs, vaultProgramId)) return null;

  const logsBlob = logs.join(" ").toLowerCase();
  if (!hasSpectraLiquidityInstruction(logsBlob)) return null;

  const pre = tx.raw_transaction?.meta?.preTokenBalances ?? [];
  const post = tx.raw_transaction?.meta?.postTokenBalances ?? [];
  const wallet = walletAddress.toLowerCase();
  const mint = usdcMint.toLowerCase();

  const preAmount = pre
    .filter(
      (r) =>
        r.owner?.toLowerCase() === wallet && r.mint?.toLowerCase() === mint,
    )
    .reduce((sum, r) => sum + tokenUiAmount(r), 0);
  const postAmount = post
    .filter(
      (r) =>
        r.owner?.toLowerCase() === wallet && r.mint?.toLowerCase() === mint,
    )
    .reduce((sum, r) => sum + tokenUiAmount(r), 0);

  const delta = postAmount - preAmount;
  if (Math.abs(delta) < 1e-9) return null;

  let inferredVaultId: string | undefined = undefined;
  for (const r of [...pre, ...post]) {
    if (r.owner?.toLowerCase() === wallet && r.mint && r.mint.toLowerCase() !== mint) {
      const match = getVaultIdFromShareMint(r.mint);
      if (match) {
        inferredVaultId = match;
        break;
      }
    }
  }

  const ts = Date.parse(tx.block_time);
  return {
    kind: delta < 0 ? "deposit" : "withdraw",
    amountUsdc: Math.abs(delta),
    timestamp: Number.isFinite(ts) ? ts : Date.now(),
    txSig: tx.hash,
    vaultId: inferredVaultId,
  };
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Fetch all SPL token balances for a Solana wallet.
 * Powers: DepositModal (real USDC balance), Portfolio page (token holdings).
 */
export async function getWalletBalances(
  address: string,
): Promise<TokenBalance[]> {
  const client = createClient();
  try {
    const { data } = await client.get<SvmBalancesResponse>(
      `/beta/svm/balances/${encodeURIComponent(address)}`,
      { params: { chains: "solana" } },
    );
    return (data.balances ?? []).map(mapSvmBalanceToTokenBalance);
  } catch (err) {
    console.error("[dune-sim] getWalletBalances failed:", err);
    return [];
  }
}

/**
 * Get the USDC balance for a wallet (convenience wrapper).
 */
export async function getUsdcBalance(
  address: string,
  usdcMint: string,
): Promise<number> {
  const balances = await getWalletBalances(address);
  const usdc = balances.find(
    (b) => b.address.toLowerCase() === usdcMint.toLowerCase(),
  );
  if (!usdc) return 0;
  return parseFloat(usdc.amount) / Math.pow(10, usdc.decimals);
}

/**
 * Fetch recent transactions for a Solana wallet.
 * Powers: Vault detail Activity Feed with real deposit/withdraw/trade data.
 */
export async function getTransactionHistory(
  address: string,
  limit = 20,
): Promise<DuneTransaction[]> {
  const client = createClient();
  try {
    const { data } = await client.get<SvmTransactionsResponse>(
      `/beta/svm/transactions/${encodeURIComponent(address)}`,
      { params: { limit, chains: "solana" } },
    );
    return (data.transactions ?? []).map(mapSvmTransactionToDune);
  } catch (err) {
    console.error("[dune-sim] getTransactionHistory failed:", err);
    return [];
  }
}

type ParsedMeta = NonNullable<ParsedTransactionWithMeta["meta"]>;

function mapParsedTokenBalancesForInfer(
  rows: ParsedMeta["preTokenBalances"],
): SvmTokenBalanceRow[] {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    owner: r.owner,
    mint: r.mint,
    uiTokenAmount: {
      amount: r.uiTokenAmount.amount,
      decimals: r.uiTokenAmount.decimals,
      uiAmountString:
        r.uiTokenAmount.uiAmountString ??
        (r.uiTokenAmount.uiAmount != null
          ? String(r.uiTokenAmount.uiAmount)
          : undefined),
    },
  }));
}

/**
 * Build a rich {@link DuneTransaction} from RPC `getParsedTransaction` meta so
 * {@link inferWalletUsdcFlow} has logs + token balance deltas (Dune rows often omit `raw_transaction`).
 */
export function duneTransactionFromParsedMeta(
  walletAddress: string,
  signature: string,
  slot: number,
  blockTimeUnixSec: number | null | undefined,
  meta: ParsedMeta,
): DuneTransaction {
  const raw_transaction: SvmRawTransaction = {
    meta: {
      err: meta.err,
      logMessages: meta.logMessages ?? undefined,
      preTokenBalances: mapParsedTokenBalancesForInfer(meta.preTokenBalances),
      postTokenBalances: mapParsedTokenBalancesForInfer(meta.postTokenBalances),
    },
    transaction: { signatures: [signature] },
  };
  const vaultProgramId = spectraVaultProgramId();
  const block_time =
    blockTimeUnixSec != null && Number.isFinite(blockTimeUnixSec)
      ? new Date(blockTimeUnixSec * 1000).toISOString()
      : new Date().toISOString();

  return {
    hash: signature,
    block_number: slot,
    block_time,
    from: walletAddress,
    to: "",
    value: "0",
    success: meta.err == null,
    transaction_type: "svm",
    decoded: inferIxFromLogs(meta.logMessages ?? undefined, vaultProgramId),
    raw_transaction,
  };
}

const TX_PARSE_DELAY_MS = 90;

function sleepMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Recent wallet history for portfolio / activity: **merge** Dune Sim with RPC
 * `getParsedTransaction` (one request per signature — many free RPC tiers disallow JSON-RPC **batch** calls used by `getParsedTransactions`).
 * Deposit/withdraw inference needs logs + `pre`/`post` token balances from parsed meta.
 */
export async function getWalletTransactionHistoryMerged(
  connection: Connection,
  walletAddress: string,
  limit: number,
): Promise<DuneTransaction[]> {
  const pk = new PublicKey(walletAddress);
  const cap = Math.max(1, Math.min(limit, 100));

  const [sigInfos, duneRows] = await Promise.all([
    connection.getSignaturesForAddress(pk, { limit: cap }, "confirmed"),
    getTransactionHistory(walletAddress, cap).catch(() => [] as DuneTransaction[]),
  ]);

  const duneBySig = new Map(duneRows.map((t) => [t.hash, t]));
  if (sigInfos.length === 0) {
    return duneRows;
  }

  const merged: DuneTransaction[] = [];

  for (let i = 0; i < sigInfos.length; i++) {
    const info = sigInfos[i]!;
    try {
      const parsed = await connection.getParsedTransaction(info.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      if (parsed?.meta) {
        merged.push(
          duneTransactionFromParsedMeta(
            walletAddress,
            info.signature,
            info.slot,
            info.blockTime ?? parsed.blockTime ?? null,
            parsed.meta,
          ),
        );
      } else {
        const fb = duneBySig.get(info.signature);
        if (fb) merged.push(fb);
      }
    } catch {
      const fb = duneBySig.get(info.signature);
      if (fb) merged.push(fb);
    }

    if (i + 1 < sigInfos.length) {
      await sleepMs(TX_PARSE_DELAY_MS);
    }
  }

  return merged;
}

/**
 * Fetch token metadata for a given mint address.
 * Powers: enriching vault share token display, prediction market token info.
 */
export async function getTokenMetadata(
  mintAddress: string,
): Promise<DuneTokenInfo | null> {
  // Sim documents SVM balances + transactions only; no stable mint-metadata route yet.
  void mintAddress;
  return null;
}

/**
 * Parse Dune SIM transactions into human-readable activity feed entries.
 */
export function parseActivityFeed(
  transactions: DuneTransaction[],
): { action: string; timestamp: string; hash: string }[] {
  return transactions.map((tx) => {
    let action = "Transaction";

    if (tx.decoded?.name) {
      const name = tx.decoded.name.toLowerCase();
      if (name.includes("deposit")) action = "Deposited USDC to vault";
      else if (name.includes("withdraw")) action = "Withdrew from vault";
      else if (name.includes("sync_nav")) action = "NAV synced on-chain";
      else if (name.includes("order") || name.includes("swap"))
        action = "Executed prediction trade";
      else action = tx.decoded.name;
    }

    return {
      action,
      timestamp: tx.block_time,
      hash: tx.hash,
    };
  });
}
