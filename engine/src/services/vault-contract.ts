import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { createHash } from "node:crypto";
import BN from "bn.js";
import { AnchorProvider, setProvider } from "@coral-xyz/anchor";

import { getConnection, getAuthority } from "./solana.js";
import { CONFIG } from "../config.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

const log = createLogger("vault-contract");

let _provider: AnchorProvider | null = null;
const PROGRAM_ID = new PublicKey(CONFIG.VAULT_PROGRAM_ID);
const SYNC_NAV_DISCRIMINATOR = createHash("sha256")
  .update("global:sync_nav")
  .digest()
  .subarray(0, 8);

function getProvider(): AnchorProvider {
  if (!_provider) {
    const connection = getConnection();
    const authority = getAuthority();
    const signOne = <T extends Transaction | VersionedTransaction>(tx: T): T => {
      if (tx instanceof Transaction) {
        tx.partialSign(authority);
      } else {
        tx.sign([authority]);
      }
      return tx;
    };
    const wallet = {
      publicKey: authority.publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
        return signOne(tx);
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(
        txs: T[],
      ): Promise<T[]> => {
        for (const tx of txs) signOne(tx);
        return txs;
      },
    };
    _provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    setProvider(_provider);
    log.info(`Program initialized: ${CONFIG.VAULT_PROGRAM_ID}`);
  }
  return _provider;
}

export function deriveVaultPda(vaultId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(vaultId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), buf],
    PROGRAM_ID,
  );
}

export function deriveAssetVaultPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("asset_vault"), vaultPda.toBuffer()],
    PROGRAM_ID,
  );
}

export function deriveStrategyPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), vaultPda.toBuffer()],
    PROGRAM_ID,
  );
}

export async function syncNav(
  vaultId: number,
  newTotalAssets: number,
): Promise<string | null> {
  return withRetry(async () => {
    const provider = getProvider();
    const authority = getAuthority();
    const [vaultPda] = deriveVaultPda(vaultId);
    const totalAssetsLamports = new BN(Math.floor(newTotalAssets * 1e6));
    const data = Buffer.alloc(16);
    SYNC_NAV_DISCRIMINATOR.copy(data, 0);
    data.writeBigUInt64LE(BigInt(totalAssetsLamports.toString(10)), 8);
    try {
      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: authority.publicKey, isSigner: true, isWritable: false },
          { pubkey: vaultPda, isSigner: false, isWritable: true },
        ],
        data,
      });
      const sig = await provider.sendAndConfirm(new Transaction().add(ix), [authority], {
        commitment: "confirmed",
      });
      log.info(`NAV synced for vault ${vaultId}: $${newTotalAssets.toFixed(2)} (tx: ${sig})`);
      return sig;
    } catch (err) {
      log.error(`Failed to sync NAV on-chain for vault ${vaultId}`, err);
      return null;
    }
  }, `syncNav(vault=${vaultId})`);
}

type ParsedVaultState = { totalAssets: number; totalShares: number };

function parseVaultState(data: Buffer): ParsedVaultState | null {
  if (data.length < 152) return null;
  const totalAssets = Number(data.readBigUInt64LE(136)) / 1e6;
  const totalShares = Number(data.readBigUInt64LE(144)) / 1e9;
  return { totalAssets, totalShares };
}

export async function fetchVaultState(vaultId: number): Promise<unknown | null> {
  try {
    const provider = getProvider();
    const [vaultPda] = deriveVaultPda(vaultId);
    const info = await provider.connection.getAccountInfo(vaultPda, "confirmed");
    if (!info?.data) return null;
    return parseVaultState(Buffer.from(info.data));
  } catch {
    log.debug(`Vault ${vaultId} account not found on-chain (may not be deployed yet)`);
    return null;
  }
}

export async function getTotalShares(vaultId: number): Promise<number> {
  const state = (await fetchVaultState(vaultId)) as ParsedVaultState | null;
  return state?.totalShares ?? 0;
}

export async function getTotalAssets(vaultId: number): Promise<number> {
  const state = (await fetchVaultState(vaultId)) as ParsedVaultState | null;
  return state?.totalAssets ?? 0;
}
