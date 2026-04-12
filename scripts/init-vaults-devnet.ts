/**
 * Initialize Spectra vault accounts (1, 2, 3) on devnet using the standard
 * devnet USDC mint — same mint the frontend uses in lib/spectra/constants.ts.
 *
 * Prerequisites:
 *   - Program **deployed** to the same cluster as your RPC (see program id in
 *     programs/spectra-vault/src/lib.rs declare_id!, lib/spectra/idl.ts, Anchor.toml).
 *     If you see "program does not exist", run from repo root:
 *       anchor build && anchor deploy --provider.cluster devnet
 *   - After changing the Rust program, regenerate the client IDL:
 *       anchor build && npm run sync:idl
 *   - Admin wallet (~/.config/solana/id.json by default) has devnet SOL
 *   - RPC URL points at devnet (RPC Fast or public devnet)
 *
 * Each vault is created with 3 instructions (BPF stack-safe): bootstrap_vault,
 * create_asset_vault, initialize_strategy_config.
 *
 * Run:
 *   npx tsx scripts/init-vaults-devnet.ts
 *
 * Env:
 *   SOLANA_RPC_URL or NEXT_PUBLIC_SOLANA_RPC_URL — RPC endpoint
 *   ANCHOR_WALLET — optional path to keypair JSON (default: ~/.config/solana/id.json)
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

import { IDL } from "../lib/spectra/idl";
import {
  SPECTRA_PROGRAM_ID,
  DEVNET_USDC_MINT,
  VAULT_IDS,
} from "../lib/spectra/constants";

const PROGRAM_ID = SPECTRA_PROGRAM_ID;

function loadKeypair(path: string): Keypair {
  const raw = readFileSync(path, "utf8");
  const arr = JSON.parse(raw) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

function deriveVaultPda(vaultId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vaultId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
}

function deriveSharesMintPda(vaultPda: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("shares_mint"), vaultPda.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

function deriveAssetVaultPda(vaultPda: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("asset_vault"), vaultPda.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

function deriveStrategyPda(vaultPda: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), vaultPda.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

const VAULT_CONFIGS: {
  id: number;
  strategyType: number;
  minProb: number;
  maxProb: number;
  maxPositionPct: number;
  lendAllocationPct: number;
  categories: string[];
}[] = [
  {
    id: VAULT_IDS.SAFE,
    strategyType: 0,
    minProb: 8500,
    maxProb: 10000,
    maxPositionPct: 1000,
    lendAllocationPct: 0,
    categories: ["crypto", "politics"],
  },
  {
    id: VAULT_IDS.CONTRARIAN,
    strategyType: 1,
    minProb: 4000,
    maxProb: 6500,
    maxPositionPct: 1000,
    lendAllocationPct: 2000,
    categories: ["politics", "economics", "crypto"],
  },
  {
    id: VAULT_IDS.YIELD,
    strategyType: 2,
    minProb: 7500,
    maxProb: 10000,
    maxPositionPct: 1000,
    lendAllocationPct: 7000,
    categories: ["crypto"],
  },
];

async function main() {
  const rpc =
    process.env.SOLANA_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
    "https://api.devnet.solana.com";

  const walletPath =
    process.env.ANCHOR_WALLET?.trim() ||
    join(homedir(), ".config/solana/id.json");

  if (!existsSync(walletPath)) {
    console.error(`Wallet not found: ${walletPath}`);
    process.exit(1);
  }

  const admin = loadKeypair(walletPath);
  const wallet = new Wallet(admin);
  const connection = new Connection(rpc, "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const program = new Program(IDL as never, provider);
  const assetMint = DEVNET_USDC_MINT;

  console.log("RPC:", rpc);
  console.log("Admin:", admin.publicKey.toBase58());
  console.log("Program:", PROGRAM_ID.toBase58());
  console.log("USDC mint:", assetMint.toBase58());

  const programAccount = await connection.getAccountInfo(PROGRAM_ID);
  if (!programAccount) {
    console.error(`
No executable program found at ${PROGRAM_ID.toBase58()} on this RPC.

Deploy the Anchor program to devnet first (same wallet / cluster as this script):

  solana config set --url devnet
  solana airdrop 2   # if you need SOL
  anchor build
  anchor deploy --provider.cluster devnet

If deploy used a different program id, update declare_id! in programs/spectra-vault/src/lib.rs,
rebuild, then sync lib/spectra/idl.ts address + Anchor.toml + NEXT_PUBLIC_SPECTRA_PROGRAM_ID.
`);
    process.exit(1);
  }
  if (!programAccount.executable) {
    console.error(
      `Account at ${PROGRAM_ID.toBase58()} exists but is not an executable program.`
    );
    process.exit(1);
  }

  const bal = await connection.getBalance(admin.publicKey);
  if (bal < 0.05 * 1e9) {
    console.warn("Low SOL balance — airdrop may be needed: solana airdrop 1");
  }

  for (const cfg of VAULT_CONFIGS) {
    const vaultId = new BN(cfg.id);
    const [vaultPda] = deriveVaultPda(vaultId);
    const sharesMint = deriveSharesMintPda(vaultPda);
    const assetVault = deriveAssetVaultPda(vaultPda);
    const strategyConfig = deriveStrategyPda(vaultPda);

    const PERFORMANCE_FEE_BPS = 1000;

    const vaultInfo = await connection.getAccountInfo(vaultPda);
    const avInfo = await connection.getAccountInfo(assetVault);
    const stInfo = await connection.getAccountInfo(strategyConfig);

    if (vaultInfo && avInfo && stInfo) {
      console.log(`Vault ${cfg.id}: already fully initialized — skip`);
      continue;
    }

    if (!vaultInfo) {
      const sig = await program.methods
        .bootstrapVault(vaultId, cfg.strategyType, PERFORMANCE_FEE_BPS)
        .accountsPartial({
          admin: admin.publicKey,
          vault: vaultPda,
          assetMint,
          sharesMint,
          token2022Program: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`Vault ${cfg.id}: bootstrap_vault — ${sig}`);
      await connection.confirmTransaction(sig, "confirmed");
    }

    if (!avInfo) {
      const sig = await program.methods
        .createAssetVault()
        .accountsPartial({
          admin: admin.publicKey,
          vault: vaultPda,
          assetMint,
          assetVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`Vault ${cfg.id}: create_asset_vault — ${sig}`);
      await connection.confirmTransaction(sig, "confirmed");
    }

    if (!stInfo) {
      const sig = await program.methods
        .initializeStrategyConfig(
          cfg.minProb,
          cfg.maxProb,
          cfg.maxPositionPct,
          cfg.lendAllocationPct,
          cfg.categories
        )
        .accountsPartial({
          admin: admin.publicKey,
          vault: vaultPda,
          strategyConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`Vault ${cfg.id}: initialize_strategy_config — ${sig}`);
      await connection.confirmTransaction(sig, "confirmed");
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
