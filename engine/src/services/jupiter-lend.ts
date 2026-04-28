import {
  PublicKey,
  Transaction,
  type Connection,
  type Keypair,
  type TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";

import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { getConnection, getAuthority, getTokenBalance } from "./solana.js";
import { CONFIG } from "../config.js";

const log = createLogger("jupiter-lend");

type LendIxsResponse = { ixs?: TransactionInstruction[] } | TransactionInstruction[];

let getDepositIxsFn: ((args: unknown) => Promise<LendIxsResponse>) | null = null;
let getWithdrawIxsFn: ((args: unknown) => Promise<LendIxsResponse>) | null = null;
let sdkLoaded = false;
let sdkLoadAttempted = false;

function rpcLooksMainnet(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("mainnet") || u.includes("mainnet-beta");
}

function lendEnabledOnCurrentCluster(): boolean {
  return rpcLooksMainnet(CONFIG.RPC_URL);
}

function normalizeIxs(result: LendIxsResponse): TransactionInstruction[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.ixs)) return result.ixs;
  return [];
}

async function ensureSdk(): Promise<boolean> {
  if (sdkLoadAttempted) return sdkLoaded;
  sdkLoadAttempted = true;
  try {
    const lendModule = await (Function('return import("@jup-ag/lend/earn")')() as Promise<{
      getDepositIxs: (args: unknown) => Promise<LendIxsResponse>;
      getWithdrawIxs: (args: unknown) => Promise<LendIxsResponse>;
    }>);
    getDepositIxsFn = lendModule.getDepositIxs;
    getWithdrawIxsFn = lendModule.getWithdrawIxs;
    sdkLoaded = true;
    log.info(`Jupiter Lend SDK loaded (lend enabled: ${lendEnabledOnCurrentCluster()})`);
  } catch (err) {
    log.warn(
      `Jupiter Lend SDK not available — instruction builders disabled: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
  return sdkLoaded;
}

export async function depositToEarn(
  connection: Connection,
  signer: Keypair,
  amount: BN,
): Promise<TransactionInstruction[]> {
  if (!lendEnabledOnCurrentCluster()) {
    log.info("Jupiter Lend deposit skipped: non-mainnet RPC configured");
    return [];
  }
  await ensureSdk();
  if (!getDepositIxsFn) return [];

  const response = await getDepositIxsFn({
    connection,
    signer: signer.publicKey,
    asset: new PublicKey(CONFIG.USDC_MINT),
    amount,
  });
  return normalizeIxs(response);
}

export async function withdrawFromEarn(
  connection: Connection,
  signer: Keypair,
  amount: BN,
): Promise<TransactionInstruction[]> {
  if (!lendEnabledOnCurrentCluster()) {
    log.info("Jupiter Lend withdraw skipped: non-mainnet RPC configured");
    return [];
  }
  await ensureSdk();
  if (!getWithdrawIxsFn) return [];

  const response = await getWithdrawIxsFn({
    connection,
    signer: signer.publicKey,
    asset: new PublicKey(CONFIG.USDC_MINT),
    amount,
  });
  return normalizeIxs(response);
}

export async function getEarnBalance(
  connection: Connection,
  signer: Keypair,
): Promise<number> {
  if (!lendEnabledOnCurrentCluster()) {
    // On devnet, treat Jupiter Earn as unavailable for deterministic NAV.
    return 0;
  }
  try {
    const accounts = await connection.getTokenAccountsByOwner(signer.publicKey, {
      mint: new PublicKey(CONFIG.USDC_MINT),
    });
    let total = 0;
    for (const { pubkey } of accounts.value) {
      total += await getTokenBalance(pubkey);
    }
    return total;
  } catch (err) {
    log.error("getEarnBalance failed", err);
    return 0;
  }
}

class JupiterLendService {
  async sendDepositToEarn(amountUsdc: number): Promise<string | null> {
    const connection = getConnection();
    const authority = getAuthority();
    const amount = new BN(Math.floor(amountUsdc * 1e6));
    const ixs = await depositToEarn(connection, authority, amount);
    if (ixs.length === 0) {
      log.info(`[noop] Jupiter Earn deposit skipped for ${amountUsdc} USDC`);
      return null;
    }

    return withRetry(async () => {
      const tx = new Transaction().add(...ixs);
      tx.feePayer = authority.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.sign(authority);
      const sig = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      log.info(`Deposited ${amountUsdc} USDC to Jupiter Earn: ${sig}`);
      return sig;
    }, "depositToEarn-send");
  }

  async sendWithdrawFromEarn(amountUsdc: number): Promise<string | null> {
    const connection = getConnection();
    const authority = getAuthority();
    const amount = new BN(Math.floor(amountUsdc * 1e6));
    const ixs = await withdrawFromEarn(connection, authority, amount);
    if (ixs.length === 0) {
      log.info(`[noop] Jupiter Earn withdraw skipped for ${amountUsdc} USDC`);
      return null;
    }

    return withRetry(async () => {
      const tx = new Transaction().add(...ixs);
      tx.feePayer = authority.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.sign(authority);
      const sig = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      log.info(`Withdrew ${amountUsdc} USDC from Jupiter Earn: ${sig}`);
      return sig;
    }, "withdrawFromEarn-send");
  }

  async getEarnBalance(): Promise<number> {
    return getEarnBalance(getConnection(), getAuthority());
  }
}

export const jupiterLend = new JupiterLendService();
