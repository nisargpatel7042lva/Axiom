import { PublicKey, TransactionInstruction, Transaction } from "@solana/web3.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { getConnection, getAuthority, getTokenBalance } from "./solana.js";
import { CONFIG } from "../config.js";

const log = createLogger("jupiter-lend");

/**
 * Jupiter Lend (Earn) service.
 *
 * In production, this calls the @jup-ag/lend SDK. During devnet testing
 * the SDK may not be available — the service falls back to no-op logging
 * so the engine never crashes.
 */
class JupiterLendService {
  private sdkAvailable = false;
  private getDepositIxsFn: any = null;
  private getWithdrawIxsFn: any = null;

  constructor() {
    this.tryLoadSdk();
  }

  private async tryLoadSdk() {
    try {
      // @jup-ag/lend is an optional dependency — may not be installed on devnet
      const lendModule = await (Function('return import("@jup-ag/lend/earn")')() as Promise<any>);
      this.getDepositIxsFn = lendModule.getDepositIxs;
      this.getWithdrawIxsFn = lendModule.getWithdrawIxs;
      this.sdkAvailable = true;
      log.info("Jupiter Lend SDK loaded");
    } catch {
      log.warn("Jupiter Lend SDK not available — lending operations will be no-ops");
    }
  }

  async depositToEarn(amountUsdc: number): Promise<string | null> {
    if (!this.sdkAvailable) {
      log.info(`[mock] Would deposit ${amountUsdc} USDC to Jupiter Earn`);
      return null;
    }

    return withRetry(
      async () => {
        const connection = getConnection();
        const authority = getAuthority();
        const amountLamports = BigInt(Math.floor(amountUsdc * 1e6));

        const ixs: TransactionInstruction[] = await this.getDepositIxsFn({
          connection,
          signer: authority.publicKey,
          asset: new PublicKey(CONFIG.USDC_MINT),
          amount: amountLamports,
        });

        const tx = new Transaction().add(...ixs);
        tx.feePayer = authority.publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.sign(authority);

        const sig = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        log.info(`Deposited ${amountUsdc} USDC to Jupiter Earn: ${sig}`);
        return sig;
      },
      "depositToEarn",
    );
  }

  async withdrawFromEarn(amountUsdc: number): Promise<string | null> {
    if (!this.sdkAvailable) {
      log.info(`[mock] Would withdraw ${amountUsdc} USDC from Jupiter Earn`);
      return null;
    }

    return withRetry(
      async () => {
        const connection = getConnection();
        const authority = getAuthority();
        const amountLamports = BigInt(Math.floor(amountUsdc * 1e6));

        const ixs: TransactionInstruction[] = await this.getWithdrawIxsFn({
          connection,
          signer: authority.publicKey,
          asset: new PublicKey(CONFIG.USDC_MINT),
          amount: amountLamports,
        });

        const tx = new Transaction().add(...ixs);
        tx.feePayer = authority.publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.sign(authority);

        const sig = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        log.info(`Withdrew ${amountUsdc} USDC from Jupiter Earn: ${sig}`);
        return sig;
      },
      "withdrawFromEarn",
    );
  }

  async getEarnBalance(): Promise<number> {
    if (!this.sdkAvailable) {
      log.debug("Lend SDK unavailable, returning 0 for earn balance");
      return 0;
    }

    try {
      const connection = getConnection();
      const authority = getAuthority();
      // The earn position is typically an ATA; the exact derivation depends on
      // the Jupiter Lend program. This is a best-effort read.
      const accounts = await connection.getTokenAccountsByOwner(authority.publicKey, {
        mint: new PublicKey(CONFIG.USDC_MINT),
      });
      let total = 0;
      for (const { pubkey } of accounts.value) {
        total += await getTokenBalance(pubkey);
      }
      return total;
    } catch (err) {
      log.error("Failed to read earn balance", err);
      return 0;
    }
  }
}

export const jupiterLend = new JupiterLendService();
