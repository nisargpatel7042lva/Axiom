use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint as LegacyMint, Token, TokenAccount},
    token_2022::Token2022,
    token_interface::Mint as IfaceMint,
};

use crate::errors::SpectraError;
use crate::state::VaultState;

const SHARE_DECIMALS: u8 = 9;
const INITIAL_HWM: u64 = 1_000_000; // 1.000000 USDC per share

/// Step 1/2: vault state + Token-2022 shares mint. Does not include legacy
/// `token_program` on the account struct to keep BPF stack under 4KiB.
pub fn bootstrap_vault_handler(
    ctx: Context<BootstrapVault>,
    vault_id: u64,
    strategy_type: u8,
    performance_fee_bps: u16,
) -> Result<()> {
    require!(strategy_type <= 2, SpectraError::InvalidStrategyType);
    require!(performance_fee_bps <= 5000, SpectraError::InvalidFeeBps);

    let vault = &mut ctx.accounts.vault;
    let (asset_vault_pda, _) = Pubkey::find_program_address(
        &[b"asset_vault", vault.key().as_ref()],
        ctx.program_id,
    );

    vault.authority = ctx.accounts.admin.key();
    vault.asset_mint = ctx.accounts.asset_mint.key();
    vault.shares_mint = ctx.accounts.shares_mint.key();
    vault.asset_vault = asset_vault_pda;
    vault.total_assets = 0;
    vault.total_shares = 0;
    vault.vault_id = vault_id;
    vault.strategy_type = strategy_type;
    vault.high_water_mark = INITIAL_HWM;
    vault.performance_fee_bps = performance_fee_bps;
    vault.is_paused = false;
    vault.bump = ctx.bumps.vault;

    Ok(())
}

/// Step 2/2: SPL token account holding USDC reserves (legacy Token program).
pub fn create_asset_vault_handler(ctx: Context<CreateAssetVault>) -> Result<()> {
    let _vault = &ctx.accounts.vault;
    Ok(())
}

#[derive(Accounts)]
#[instruction(vault_id: u64)]
pub struct BootstrapVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = VaultState::LEN,
        seeds = [b"vault", vault_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub vault: Box<Account<'info, VaultState>>,

    pub asset_mint: Box<Account<'info, LegacyMint>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"shares_mint", vault.key().as_ref()],
        bump,
        mint::decimals = SHARE_DECIMALS,
        mint::authority = vault,
        mint::token_program = token_2022_program,
    )]
    pub shares_mint: Box<InterfaceAccount<'info, IfaceMint>>,

    pub token_2022_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAssetVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        constraint = vault.authority == admin.key() @ SpectraError::Unauthorized,
    )]
    pub vault: Box<Account<'info, VaultState>>,

    #[account(address = vault.asset_mint)]
    pub asset_mint: Box<Account<'info, LegacyMint>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"asset_vault", vault.key().as_ref()],
        bump,
        token::mint = asset_mint,
        token::authority = vault,
        token::token_program = token_program,
    )]
    pub asset_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
