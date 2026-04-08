import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BN, setProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet.js";
import { getConnection, getAuthority } from "./solana.js";
import { CONFIG } from "../config.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import type { VaultState } from "../types/index.js";

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
    _program = new Program(stubIdl as any, provider);
    log.info(`Program initialized: ${CONFIG.VAULT_PROGRAM_ID}`);
  }
  return _program;
}

export function deriveVaultPda(vaultId: number): [PublicKey, number] {
  const usdcMint = new PublicKey(CONFIG.USDC_MINT);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(vaultId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), usdcMint.toBuffer(), buf],
    new PublicKey(CONFIG.VAULT_PROGRAM_ID),
  );
}

export function deriveStrategyPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), vaultPda.toBuffer()],
    new PublicKey(CONFIG.VAULT_PROGRAM_ID),
  );
}

/**
 * Sync the vault's total_assets on-chain after off-chain NAV computation.
 */
export async function syncNav(vaultId: number, newTotalAssets: number): Promise<string | null> {
  return withRetry(
    async () => {
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
          } as any)
          .signers([authority])
          .rpc();

        log.info(`NAV synced for vault ${vaultId}: $${newTotalAssets.toFixed(2)} (tx: ${sig})`);
        return sig;
      } catch (err) {
        log.error(`Failed to sync NAV on-chain for vault ${vaultId}`, err);
        return null;
      }
    },
    `syncNav(vault=${vaultId})`,
  );
}

/**
 * Fetch the on-chain vault state.
 * Returns null if the account doesn't exist yet (pre-deploy).
 */
export async function fetchVaultState(vaultId: number): Promise<VaultState | null> {
  try {
    const program = getProgram();
    const [vaultPda] = deriveVaultPda(vaultId);
    const account = await (program.account as any).vaultState.fetch(vaultPda);
    return account as VaultState;
  } catch {
    log.debug(`Vault ${vaultId} account not found on-chain (may not be deployed yet)`);
    return null;
  }
}

/**
 * Read total shares outstanding for a vault from chain.
 */
export async function getTotalShares(vaultId: number): Promise<number> {
  const state = await fetchVaultState(vaultId);
  if (!state) return 0;
  return Number(state.totalShares) / 1e9; // shares have 9 decimals
}

/**
 * Read total assets for a vault from chain.
 */
export async function getTotalAssets(vaultId: number): Promise<number> {
  const state = await fetchVaultState(vaultId);
  if (!state) return 0;
  return Number(state.totalAssets) / 1e6; // USDC has 6 decimals
}
