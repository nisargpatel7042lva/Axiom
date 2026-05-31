import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { createHash } from "node:crypto";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { getConnection, getAuthority } from "./solana.js";
import { deriveVaultPda, deriveSharesMintPda } from "./vault-contract.js";
import { CONFIG } from "../config.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

const log = createLogger("vault-admin");

const PROGRAM_ID = new PublicKey(CONFIG.VAULT_PROGRAM_ID);
const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

function disc(name: string): Buffer {
  return Buffer.from(
    createHash("sha256").update(`global:${name}`).digest().subarray(0, 8),
  );
}

const COLLECT_FEE_DISC = disc("collect_performance_fee");
const PAUSE_DISC = disc("pause");
const UNPAUSE_DISC = disc("unpause");

let _provider: AnchorProvider | null = null;

function getProvider(): AnchorProvider {
  if (!_provider) {
    const connection = getConnection();
    const authority = getAuthority();
    const signOne = <T extends Transaction | VersionedTransaction>(tx: T): T => {
      if (tx instanceof Transaction) tx.partialSign(authority);
      else tx.sign([authority]);
      return tx;
    };
    _provider = new AnchorProvider(
      connection,
      {
        publicKey: authority.publicKey,
        signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T) => signOne(tx),
        signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]) => {
          txs.forEach(signOne);
          return txs;
        },
      },
      { commitment: "confirmed" },
    );
    setProvider(_provider);
  }
  return _provider;
}

/**
 * Call `collect_performance_fee` on-chain.
 * Only succeeds when current PPS > high_water_mark — the program enforces this.
 * Fee shares are minted to the authority's Token-2022 ATA.
 */
export async function collectPerformanceFee(vaultId: number): Promise<string | null> {
  return withRetry(async () => {
    const provider = getProvider();
    const authority = getAuthority();
    const [vaultPda] = deriveVaultPda(vaultId);
    const [sharesMint] = deriveSharesMintPda(vaultPda);

    // ATA of authority for the vault's Token-2022 share mint
    const authoritySharesAccount = getAssociatedTokenAddressSync(
      sharesMint,
      authority.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: authority.publicKey,    isSigner: true,  isWritable: true  },
        { pubkey: vaultPda,               isSigner: false, isWritable: true  },
        { pubkey: sharesMint,             isSigner: false, isWritable: true  },
        { pubkey: authoritySharesAccount, isSigner: false, isWritable: true  },
        { pubkey: TOKEN_2022_PROGRAM_ID,  isSigner: false, isWritable: false },
        { pubkey: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
        { pubkey: SYSTEM_PROGRAM_ID,      isSigner: false, isWritable: false },
      ],
      data: COLLECT_FEE_DISC,
    });

    try {
      const sig = await provider.sendAndConfirm(new Transaction().add(ix), [authority], {
        commitment: "confirmed",
      });
      log.info(`Performance fee collected for vault ${vaultId}: ${sig}`);
      return sig;
    } catch (err) {
      // NoFeeToCollect is expected when PPS has not risen above HWM — not an error.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NoFeeToCollect")) {
        log.debug(`Vault ${vaultId}: no fee to collect (PPS ≤ HWM)`);
        return null;
      }
      log.error(`collectPerformanceFee failed for vault ${vaultId}`, err);
      return null;
    }
  }, `collectPerformanceFee(vault=${vaultId})`);
}

/**
 * Pause a vault. Blocks all deposits and withdrawals immediately.
 * Use in response to a detected exploit, oracle failure, or emergency.
 */
export async function pauseVault(vaultId: number): Promise<string | null> {
  return withRetry(async () => {
    const provider = getProvider();
    const authority = getAuthority();
    const [vaultPda] = deriveVaultPda(vaultId);

    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: authority.publicKey, isSigner: true,  isWritable: false },
        { pubkey: vaultPda,            isSigner: false, isWritable: true  },
      ],
      data: PAUSE_DISC,
    });

    const sig = await provider.sendAndConfirm(new Transaction().add(ix), [authority], {
      commitment: "confirmed",
    });
    log.warn(`Vault ${vaultId} PAUSED: ${sig}`);
    return sig;
  }, `pauseVault(vault=${vaultId})`);
}

/**
 * Unpause a vault. Re-enables deposits and withdrawals.
 * Only call after the incident that triggered the pause has been resolved.
 */
export async function unpauseVault(vaultId: number): Promise<string | null> {
  return withRetry(async () => {
    const provider = getProvider();
    const authority = getAuthority();
    const [vaultPda] = deriveVaultPda(vaultId);

    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: authority.publicKey, isSigner: true,  isWritable: false },
        { pubkey: vaultPda,            isSigner: false, isWritable: true  },
      ],
      data: UNPAUSE_DISC,
    });

    const sig = await provider.sendAndConfirm(new Transaction().add(ix), [authority], {
      commitment: "confirmed",
    });
    log.info(`Vault ${vaultId} unpaused: ${sig}`);
    return sig;
  }, `unpauseVault(vault=${vaultId})`);
}
