import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet.js";

import { getConnection, getAuthority } from "./solana.js";
import { CONFIG } from "../config.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

const log = createLogger("vault-contract");

let _program: Program | null = null;

function getProgram(): Program {
  if (!_program) {
    const connection = getConnection();
    const authority = getAuthority();
    const wallet = new NodeWallet(authority);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    setProvider(provider);

    const stubIdl = {
      version: "0.1.0",
      name: "spectra_vault",
      instructions: [],
      accounts: [],
      types: [],
      metadata: { address: CONFIG.VAULT_PROGRAM_ID },
    };
    _program = new Program(stubIdl as never, provider);
    log.info(`Program initialized: ${CONFIG.VAULT_PROGRAM_ID}`);
  }
  return _program;
}

export function deriveVaultPda(vaultId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(vaultId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), buf],
    new PublicKey(CONFIG.VAULT_PROGRAM_ID),
  );
}

export function deriveAssetVaultPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("asset_vault"), vaultPda.toBuffer()],
    new PublicKey(CONFIG.VAULT_PROGRAM_ID),
  );
}

export function deriveStrategyPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), vaultPda.toBuffer()],
    new PublicKey(CONFIG.VAULT_PROGRAM_ID),
  );
}

export async function syncNav(
  vaultId: number,
  newTotalAssets: number,
): Promise<string | null> {
  return withRetry(async () => {
    const program = getProgram();
    const authority = getAuthority();
    const [vaultPda] = deriveVaultPda(vaultId);
    const totalAssetsLamports = new BN(Math.floor(newTotalAssets * 1e6));
    try {
      const sig = await program.methods
        .syncNav(totalAssetsLamports)
        .accounts({
          vault: vaultPda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();
      log.info(`NAV synced for vault ${vaultId}: $${newTotalAssets.toFixed(2)} (tx: ${sig})`);
      return sig;
    } catch (err) {
      log.error(`Failed to sync NAV on-chain for vault ${vaultId}`, err);
      return null;
    }
  }, `syncNav(vault=${vaultId})`);
}

type VaultStateAccount = { fetch: (pk: PublicKey) => Promise<unknown> };

export async function fetchVaultState(vaultId: number): Promise<unknown | null> {
  try {
    const program = getProgram();
    const [vaultPda] = deriveVaultPda(vaultId);
    const ns = program.account as unknown as { vaultState?: VaultStateAccount };
    if (!ns.vaultState) return null;
    const account = await ns.vaultState.fetch(vaultPda);
    return account;
  } catch {
    log.debug(`Vault ${vaultId} account not found on-chain (may not be deployed yet)`);
    return null;
  }
}

export async function getTotalShares(vaultId: number): Promise<number> {
  const state = (await fetchVaultState(vaultId)) as { totalShares?: BN } | null;
  if (!state?.totalShares) return 0;
  return Number(state.totalShares) / 1e9;
}

export async function getTotalAssets(vaultId: number): Promise<number> {
  const state = (await fetchVaultState(vaultId)) as { totalAssets?: BN } | null;
  if (!state?.totalAssets) return 0;
  return Number(state.totalAssets) / 1e6;
}
