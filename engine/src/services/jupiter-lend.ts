import {
  PublicKey,
  TransactionInstruction,
  Transaction,
  type Connection,
  type Keypair,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { getConnection, getAuthority, getTokenBalance } from "./solana.js";
import { CONFIG } from "../config.js";

const log = createLogger("jupiter-lend");

let getDepositIxsFn: ((args: unknown) => Promise<TransactionInstruction[]>) | null = null;
let getWithdrawIxsFn: ((args: unknown) => Promise<TransactionInstruction[]>) | null = null;
let sdkLoaded = false;
let sdkLoadAttempted = false;

async function ensureSdk(): Promise<boolean> {
  if (sdkLoadAttempted) return sdkLoaded;
  sdkLoadAttempted = true;
  try {
    const lendModule = await (Function('return import("@jup-ag/lend/earn")')() as Promise<{
      getDepositIxs: (args: unknown) => Promise<TransactionInstruction[]>;
      getWithdrawIxs: (args: unknown) => Promise<TransactionInstruction[]>;
    }>);
    getDepositIxsFn = lendModule.getDepositIxs;
    getWithdrawIxsFn = lendModule.getWithdrawIxs;
    sdkLoaded = true;
    log.info("Jupiter Lend SDK loaded");
  } catch {
    log.warn("Jupiter Lend SDK not available — instruction builders return []");
  }
  return sdkLoaded;
}

/**
 * Jupiter Lend Earn — deposit instructions (PROMPT spec).
 * Uses getDepositIxs from @jup-ag/lend/earn.
 */
export async function depositToEarn(
  connection: Connection,
  signer: Keypair,
  amount: BN,
): Promise<TransactionInstruction[]> {
  await ensureSdk();
  if (!getDepositIxsFn) return [];

  const ixs = await getDepositIxsFn({
    connection,
    signer: signer.publicKey,
    asset: new PublicKey(CONFIG.USDC_MINT),
    amount,
  });
  return ixs;
}

/**
 * Jupiter Lend Earn — withdraw instructions (PROMPT spec).
 */
export async function withdrawFromEarn(
  connection: Connection,
  signer: Keypair,
  amount: BN,
): Promise<TransactionInstruction[]> {
  await ensureSdk();
  if (!getWithdrawIxsFn) return [];

  const ixs = await getWithdrawIxsFn({
    connection,
    signer: signer.publicKey,
    asset: new PublicKey(CONFIG.USDC_MINT),
    amount,
  });
  return ixs;
}

/**
 * Read aggregate USDC token balance for the signer (best-effort Earn position).
 */
export async function getEarnBalance(
  connection: Connection,
  signer: Keypair,
): Promise<number> {
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

// ---------------------------------------------------------------------------
// High-level helpers (send transactions) — used by yield-router / engine
// ---------------------------------------------------------------------------

class JupiterLendService {
  async sendDepositToEarn(amountUsdc: number): Promise<string | null> {
    const connection = getConnection();
    const authority = getAuthority();
    const amount = new BN(Math.floor(amountUsdc * 1e6));
    const ixs = await depositToEarn(connection, authority, amount);
    if (ixs.length === 0) {
      log.info(`[mock] Would deposit ${amountUsdc} USDC to Jupiter Earn`);
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
      log.info(`[mock] Would withdraw ${amountUsdc} USDC from Jupiter Earn`);
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
