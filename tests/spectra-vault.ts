import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { SpectraVault } from "../target/types/spectra_vault";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("spectra-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SpectraVault as Program<SpectraVault>;
  const admin = provider.wallet as anchor.Wallet;
  const user = Keypair.generate();

  let usdcMint: PublicKey;
  let vaultPda: PublicKey;
  let vaultBump: number;
  let sharesMintPda: PublicKey;
  let assetVaultPda: PublicKey;
  let strategyPda: PublicKey;

  const VAULT_ID = new BN(1);
  const USDC_DECIMALS = 6;
  const SHARE_DECIMALS = 9;
  const STRATEGY_SAFE = 0; // Safe Consensus
  const PERFORMANCE_FEE_BPS = 1000; // 10%
  const DEPOSIT_AMOUNT = new BN(100_000_000); // 100 USDC

  before(async () => {
    // Airdrop SOL to user
    const sig = await provider.connection.requestAirdrop(
      user.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Create USDC mock mint (admin is mint authority)
    usdcMint = await createMint(
      provider.connection,
      (admin as any).payer,
      admin.publicKey,
      null,
      USDC_DECIMALS,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    // Derive PDAs
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), VAULT_ID.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [sharesMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("shares_mint"), vaultPda.toBuffer()],
      program.programId
    );

    [assetVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("asset_vault"), vaultPda.toBuffer()],
      program.programId
    );

    [strategyPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), vaultPda.toBuffer()],
      program.programId
    );

    // Mint USDC to user
    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      (admin as any).payer,
      usdcMint,
      user.publicKey
    );

    await mintTo(
      provider.connection,
      (admin as any).payer,
      usdcMint,
      userUsdcAta.address,
      admin.publicKey,
      1_000_000_000 // 1000 USDC
    );
  });

  // ─── INITIALIZE ───────────────────────────────────────────────────────────

  it("initializes a vault", async () => {
    const tx = await program.methods
      .initializeVault(
        VAULT_ID,
        STRATEGY_SAFE,
        PERFORMANCE_FEE_BPS,
        8500, // min_probability 85%
        10000, // max_probability 100%
        1000, // max_position 10%
        0, // lend_allocation 0%
        ["crypto", "politics"]
      )
      .accounts({
        admin: admin.publicKey,
        vault: vaultPda,
        assetMint: usdcMint,
        sharesMint: sharesMintPda,
        assetVault: assetVaultPda,
        strategyConfig: strategyPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vault = await program.account.vaultState.fetch(vaultPda);
    assert.ok(vault.authority.equals(admin.publicKey));
    assert.ok(vault.assetMint.equals(usdcMint));
    assert.ok(vault.sharesMint.equals(sharesMintPda));
    assert.ok(vault.assetVault.equals(assetVaultPda));
    assert.equal(vault.totalAssets.toNumber(), 0);
    assert.equal(vault.totalShares.toNumber(), 0);
    assert.equal(vault.vaultId.toNumber(), VAULT_ID.toNumber());
    assert.equal(vault.strategyType, STRATEGY_SAFE);
    assert.equal(vault.highWaterMark.toNumber(), 1_000_000); // 1.0 USDC/share
    assert.equal(vault.performanceFeeBps, PERFORMANCE_FEE_BPS);
    assert.equal(vault.isPaused, false);

    const strategy = await program.account.strategyConfig.fetch(strategyPda);
    assert.ok(strategy.vault.equals(vaultPda));
    assert.equal(strategy.minProbability, 8500);
    assert.equal(strategy.maxProbability, 10000);
    assert.equal(strategy.maxPositionPct, 1000);
    assert.equal(strategy.lendAllocationPct, 0);
    assert.deepEqual(strategy.categories, ["crypto", "politics"]);
    assert.equal(strategy.isActive, true);
  });

  // ─── DEPOSIT ──────────────────────────────────────────────────────────────

  it("deposits USDC and mints shares", async () => {
    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      usdcMint,
      user.publicKey
    );

    const userSharesAta = await anchor.utils.token.associatedAddress({
      mint: sharesMintPda,
      owner: user.publicKey,
    });

    const tx = await program.methods
      .deposit(DEPOSIT_AMOUNT)
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        assetMint: usdcMint,
        sharesMint: sharesMintPda,
        assetVault: assetVaultPda,
        userAssetAccount: userUsdcAta.address,
        userSharesAccount: userSharesAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const vault = await program.account.vaultState.fetch(vaultPda);
    assert.equal(vault.totalAssets.toNumber(), DEPOSIT_AMOUNT.toNumber());

    // First deposit: shares = amount * 1000 (decimal adjustment 6→9)
    const expectedShares = DEPOSIT_AMOUNT.toNumber() * 1000;
    assert.equal(vault.totalShares.toNumber(), expectedShares);

    // Verify share tokens minted
    const sharesAccount = await getAccount(
      provider.connection,
      userSharesAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.equal(Number(sharesAccount.amount), expectedShares);
  });

  it("deposits again and receives proportional shares", async () => {
    const secondDeposit = new BN(50_000_000); // 50 USDC

    const vaultBefore = await program.account.vaultState.fetch(vaultPda);

    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      usdcMint,
      user.publicKey
    );

    const userSharesAta = await anchor.utils.token.associatedAddress({
      mint: sharesMintPda,
      owner: user.publicKey,
    });

    await program.methods
      .deposit(secondDeposit)
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        assetMint: usdcMint,
        sharesMint: sharesMintPda,
        assetVault: assetVaultPda,
        userAssetAccount: userUsdcAta.address,
        userSharesAccount: userSharesAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const vaultAfter = await program.account.vaultState.fetch(vaultPda);

    // shares = deposit * total_shares / total_assets
    const expectedNewShares = secondDeposit
      .mul(vaultBefore.totalShares)
      .div(vaultBefore.totalAssets)
      .toNumber();

    const actualNewShares =
      vaultAfter.totalShares.toNumber() - vaultBefore.totalShares.toNumber();
    assert.equal(actualNewShares, expectedNewShares);
    assert.equal(
      vaultAfter.totalAssets.toNumber(),
      vaultBefore.totalAssets.toNumber() + secondDeposit.toNumber()
    );
  });

  // ─── DEPOSIT GUARDS ───────────────────────────────────────────────────────

  it("rejects zero deposit", async () => {
    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      usdcMint,
      user.publicKey
    );

    const userSharesAta = await anchor.utils.token.associatedAddress({
      mint: sharesMintPda,
      owner: user.publicKey,
    });

    try {
      await program.methods
        .deposit(new BN(0))
        .accounts({
          user: user.publicKey,
          vault: vaultPda,
          assetMint: usdcMint,
          sharesMint: sharesMintPda,
          assetVault: assetVaultPda,
          userAssetAccount: userUsdcAta.address,
          userSharesAccount: userSharesAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.include(err.toString(), "InvalidAmount");
    }
  });

  // ─── SYNC NAV ─────────────────────────────────────────────────────────────

  it("syncs NAV (authority only)", async () => {
    const newTotalAssets = new BN(160_000_000); // 160 USDC (simulating profit)

    await program.methods
      .syncNav(newTotalAssets)
      .accounts({
        authority: admin.publicKey,
        vault: vaultPda,
      })
      .rpc();

    const vault = await program.account.vaultState.fetch(vaultPda);
    assert.equal(vault.totalAssets.toNumber(), newTotalAssets.toNumber());
  });

  it("rejects sync_nav from non-authority", async () => {
    try {
      await program.methods
        .syncNav(new BN(200_000_000))
        .accounts({
          authority: user.publicKey,
          vault: vaultPda,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.include(err.toString(), "Unauthorized");
    }
  });

  // ─── PAUSE / UNPAUSE ─────────────────────────────────────────────────────

  it("pauses the vault", async () => {
    await program.methods
      .pause()
      .accounts({
        authority: admin.publicKey,
        vault: vaultPda,
      })
      .rpc();

    const vault = await program.account.vaultState.fetch(vaultPda);
    assert.equal(vault.isPaused, true);
  });

  it("rejects deposit when paused", async () => {
    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      usdcMint,
      user.publicKey
    );

    const userSharesAta = await anchor.utils.token.associatedAddress({
      mint: sharesMintPda,
      owner: user.publicKey,
    });

    try {
      await program.methods
        .deposit(new BN(10_000_000))
        .accounts({
          user: user.publicKey,
          vault: vaultPda,
          assetMint: usdcMint,
          sharesMint: sharesMintPda,
          assetVault: assetVaultPda,
          userAssetAccount: userUsdcAta.address,
          userSharesAccount: userSharesAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.include(err.toString(), "VaultPaused");
    }
  });

  it("rejects pause from non-authority", async () => {
    try {
      await program.methods
        .unpause()
        .accounts({
          authority: user.publicKey,
          vault: vaultPda,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.include(err.toString(), "Unauthorized");
    }
  });

  it("unpauses the vault", async () => {
    await program.methods
      .unpause()
      .accounts({
        authority: admin.publicKey,
        vault: vaultPda,
      })
      .rpc();

    const vault = await program.account.vaultState.fetch(vaultPda);
    assert.equal(vault.isPaused, false);
  });

  // ─── WITHDRAW ─────────────────────────────────────────────────────────────

  it("withdraws by burning shares", async () => {
    const vaultBefore = await program.account.vaultState.fetch(vaultPda);

    // Burn half the shares
    const sharesToBurn = vaultBefore.totalShares.div(new BN(2));

    const expectedUsdc = sharesToBurn
      .mul(vaultBefore.totalAssets)
      .div(vaultBefore.totalShares);

    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      usdcMint,
      user.publicKey
    );

    const userSharesAta = await anchor.utils.token.associatedAddress({
      mint: sharesMintPda,
      owner: user.publicKey,
    });

    const usdcBefore = (
      await getAccount(provider.connection, userUsdcAta.address)
    ).amount;

    await program.methods
      .withdraw(sharesToBurn)
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        assetMint: usdcMint,
        sharesMint: sharesMintPda,
        assetVault: assetVaultPda,
        userAssetAccount: userUsdcAta.address,
        userSharesAccount: userSharesAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const vaultAfter = await program.account.vaultState.fetch(vaultPda);
    assert.equal(
      vaultAfter.totalShares.toNumber(),
      vaultBefore.totalShares.toNumber() - sharesToBurn.toNumber()
    );
    assert.equal(
      vaultAfter.totalAssets.toNumber(),
      vaultBefore.totalAssets.toNumber() - expectedUsdc.toNumber()
    );

    const usdcAfter = (
      await getAccount(provider.connection, userUsdcAta.address)
    ).amount;
    assert.equal(
      Number(usdcAfter) - Number(usdcBefore),
      expectedUsdc.toNumber()
    );
  });

  // ─── COLLECT PERFORMANCE FEE ──────────────────────────────────────────────

  it("collects performance fee when PPS > HWM", async () => {
    // First sync NAV upward to create profit
    const vaultBefore = await program.account.vaultState.fetch(vaultPda);
    const boostedAssets = vaultBefore.totalAssets.add(new BN(20_000_000)); // +20 USDC profit
    await program.methods
      .syncNav(boostedAssets)
      .accounts({
        authority: admin.publicKey,
        vault: vaultPda,
      })
      .rpc();

    const authoritySharesAta = await anchor.utils.token.associatedAddress({
      mint: sharesMintPda,
      owner: admin.publicKey,
    });

    const vaultPreFee = await program.account.vaultState.fetch(vaultPda);

    await program.methods
      .collectPerformanceFee()
      .accounts({
        authority: admin.publicKey,
        vault: vaultPda,
        sharesMint: sharesMintPda,
        authoritySharesAccount: authoritySharesAta,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultPostFee = await program.account.vaultState.fetch(vaultPda);

    // Fee shares should have been minted (total_shares increased)
    assert.isAbove(
      vaultPostFee.totalShares.toNumber(),
      vaultPreFee.totalShares.toNumber()
    );

    // HWM should have been updated
    assert.isAbove(
      vaultPostFee.highWaterMark.toNumber(),
      vaultBefore.highWaterMark.toNumber()
    );

    // Authority should hold some share tokens
    const authorityShares = await getAccount(
      provider.connection,
      authoritySharesAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.isAbove(Number(authorityShares.amount), 0);
  });

  it("rejects fee collection when PPS <= HWM", async () => {
    try {
      const authoritySharesAta = await anchor.utils.token.associatedAddress({
        mint: sharesMintPda,
        owner: admin.publicKey,
      });

      await program.methods
        .collectPerformanceFee()
        .accounts({
          authority: admin.publicKey,
          vault: vaultPda,
          sharesMint: sharesMintPda,
          authoritySharesAccount: authoritySharesAta,
          token2022Program: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.include(err.toString(), "NoFeeToCollect");
    }
  });

  // ─── EDGE CASES ───────────────────────────────────────────────────────────

  it("rejects withdrawal with insufficient shares", async () => {
    const vault = await program.account.vaultState.fetch(vaultPda);
    const tooMany = vault.totalShares.add(new BN(1));

    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      usdcMint,
      user.publicKey
    );

    const userSharesAta = await anchor.utils.token.associatedAddress({
      mint: sharesMintPda,
      owner: user.publicKey,
    });

    try {
      await program.methods
        .withdraw(tooMany)
        .accounts({
          user: user.publicKey,
          vault: vaultPda,
          assetMint: usdcMint,
          sharesMint: sharesMintPda,
          assetVault: assetVaultPda,
          userAssetAccount: userUsdcAta.address,
          userSharesAccount: userSharesAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.include(err.toString(), "InsufficientShares");
    }
  });
});
