import { Program } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionSignature,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID as SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";
import type { SpectraVault } from "./idl";
import type {
  VaultState,
  StrategyConfig,
  DepositPreview,
  WithdrawPreview,
} from "./types";
import {
  SPECTRA_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  DECIMAL_ADJUSTMENT,
  PPS_PRECISION,
  getUsdcMint,
} from "./constants";
import { signSendAndConfirmLegacyTx } from "./sign-send-confirm";

// ---------------------------------------------------------------------------
// PDA derivation helpers
// ---------------------------------------------------------------------------

export function deriveVaultPda(vaultId: number | BN): [PublicKey, number] {
  const id = BN.isBN(vaultId) ? vaultId : new BN(vaultId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), id.toArrayLike(Buffer, "le", 8)],
    SPECTRA_PROGRAM_ID
  );
}

export function deriveSharesMintPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("shares_mint"), vaultPda.toBuffer()],
    SPECTRA_PROGRAM_ID
  );
}

export function deriveAssetVaultPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("asset_vault"), vaultPda.toBuffer()],
    SPECTRA_PROGRAM_ID
  );
}

export function deriveStrategyPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), vaultPda.toBuffer()],
    SPECTRA_PROGRAM_ID
  );
}

// ---------------------------------------------------------------------------
// Account fetchers
// ---------------------------------------------------------------------------

export async function getVaultState(
  program: Program<SpectraVault>,
  vaultId: number
): Promise<VaultState> {
  const [vaultPda] = deriveVaultPda(vaultId);
  const raw = await (program.account as any).vaultState.fetch(vaultPda);
  return raw as VaultState;
}

export async function getStrategyConfig(
  program: Program<SpectraVault>,
  vaultPda: PublicKey
): Promise<StrategyConfig> {
  const [strategyPda] = deriveStrategyPda(vaultPda);
  const raw = await (program.account as any).strategyConfig.fetch(strategyPda);
  return raw as StrategyConfig;
}

/**
 * Fetch a user's Token-2022 share token balance for a given shares mint.
 * Returns 0 if the ATA doesn't exist (user has never received shares).
 */
export async function getUserShares(
  connection: Connection,
  sharesMint: PublicKey,
  userPublicKey: PublicKey
): Promise<BN> {
  const ata = getAssociatedTokenAddressSync(
    sharesMint,
    userPublicKey,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  try {
    const account = await getAccount(
      connection,
      ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    return new BN(account.amount.toString());
  } catch {
    return new BN(0);
  }
}

// ---------------------------------------------------------------------------
// Deposit
// ---------------------------------------------------------------------------

export async function deposit(
  program: Program<SpectraVault>,
  vaultId: number,
  amount: BN,
  userPublicKey: PublicKey
): Promise<TransactionSignature> {
  const [vaultPda] = deriveVaultPda(vaultId);
  const [sharesMint] = deriveSharesMintPda(vaultPda);
  const [assetVault] = deriveAssetVaultPda(vaultPda);
  const assetMint = getUsdcMint();

  const userAssetAccount = getAssociatedTokenAddressSync(
    assetMint,
    userPublicKey,
    false,
    SPL_TOKEN_PROGRAM_ID
  );

  const userSharesAccount = getAssociatedTokenAddressSync(
    sharesMint,
    userPublicKey,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  const createUserUsdcAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    userPublicKey,
    userAssetAccount,
    userPublicKey,
    assetMint,
    SPL_TOKEN_PROGRAM_ID,
    SPL_ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = await program.methods
    .deposit(amount)
    .accountsPartial({
      user: userPublicKey,
      vault: vaultPda,
      assetMint,
      sharesMint,
      assetVault,
      userAssetAccount,
      userSharesAccount,
      tokenProgram: SPL_TOKEN_PROGRAM_ID,
      token2022Program: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .preInstructions([createUserUsdcAtaIx])
    .transaction();

  return signSendAndConfirmLegacyTx(program, tx);
}

// ---------------------------------------------------------------------------
// Withdraw
// ---------------------------------------------------------------------------

export async function withdraw(
  program: Program<SpectraVault>,
  vaultId: number,
  sharesAmount: BN,
  userPublicKey: PublicKey
): Promise<TransactionSignature> {
  const [vaultPda] = deriveVaultPda(vaultId);
  const [sharesMint] = deriveSharesMintPda(vaultPda);
  const [assetVault] = deriveAssetVaultPda(vaultPda);
  const assetMint = getUsdcMint();

  const userAssetAccount = getAssociatedTokenAddressSync(
    assetMint,
    userPublicKey,
    false,
    SPL_TOKEN_PROGRAM_ID
  );

  const userSharesAccount = getAssociatedTokenAddressSync(
    sharesMint,
    userPublicKey,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  const createUserUsdcAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    userPublicKey,
    userAssetAccount,
    userPublicKey,
    assetMint,
    SPL_TOKEN_PROGRAM_ID,
    SPL_ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = await program.methods
    .withdraw(sharesAmount)
    .accountsPartial({
      user: userPublicKey,
      vault: vaultPda,
      assetMint,
      sharesMint,
      assetVault,
      userAssetAccount,
      userSharesAccount,
      tokenProgram: SPL_TOKEN_PROGRAM_ID,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .preInstructions([createUserUsdcAtaIx])
    .transaction();

  return signSendAndConfirmLegacyTx(program, tx);
}

// ---------------------------------------------------------------------------
// Pure preview helpers (no RPC calls)
// ---------------------------------------------------------------------------

/**
 * Mirrors the on-chain deposit math:
 *  - first deposit: shares = amount * DECIMAL_ADJUSTMENT
 *  - subsequent:    shares = amount * totalShares / totalAssets
 *
 * All values in their native base units (USDC = 6 decimals, shares = 9).
 */
export function previewDeposit(
  vault: VaultState,
  amount: BN
): DepositPreview {
  const totalShares = vault.totalShares;
  const totalAssets = vault.totalAssets;

  let sharesToReceive: BN;

  if (totalShares.isZero()) {
    sharesToReceive = amount.mul(new BN(DECIMAL_ADJUSTMENT));
  } else {
    sharesToReceive = amount.mul(totalShares).div(totalAssets);
  }

  const pps = totalShares.isZero()
    ? 1.0
    : totalAssets
        .mul(new BN(PPS_PRECISION))
        .div(totalShares)
        .toNumber() / PPS_PRECISION;

  return { sharesToReceive, estimatedPPS: pps };
}

/**
 * Mirrors the on-chain withdraw math:
 *  usdc_to_return = shares * totalAssets / totalShares
 */
export function previewWithdraw(
  vault: VaultState,
  shares: BN
): WithdrawPreview {
  const totalShares = vault.totalShares;
  const totalAssets = vault.totalAssets;

  const usdcToReceive = totalShares.isZero()
    ? new BN(0)
    : shares.mul(totalAssets).div(totalShares);

  const pps = totalShares.isZero()
    ? 1.0
    : totalAssets
        .mul(new BN(PPS_PRECISION))
        .div(totalShares)
        .toNumber() / PPS_PRECISION;

  return { usdcToReceive, estimatedPPS: pps };
}

// ---------------------------------------------------------------------------
// Convenience: compute current PPS for a vault
// ---------------------------------------------------------------------------

export function computePPS(vault: VaultState): number {
  if (vault.totalShares.isZero()) return 1.0;
  return (
    vault.totalAssets
      .mul(new BN(PPS_PRECISION))
      .div(vault.totalShares)
      .toNumber() / PPS_PRECISION
  );
}
