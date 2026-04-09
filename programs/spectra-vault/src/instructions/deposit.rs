use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_2022::Token2022,
    token_interface::{self, Mint, MintTo, TokenAccount, TransferChecked},
};

use crate::errors::SpectraError;
use crate::events::DepositEvent;
use crate::state::VaultState;

/// 10^(share_decimals - asset_decimals) = 10^(9-6) = 1000
const DECIMAL_ADJUSTMENT: u64 = 1_000;

pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, SpectraError::InvalidAmount);

    let vault = &ctx.accounts.vault;
    let total_assets = vault.total_assets;
    let total_shares = vault.total_shares;

    let shares_to_mint: u64 = if total_shares == 0 {
        amount
            .checked_mul(DECIMAL_ADJUSTMENT)
            .ok_or(SpectraError::MathOverflow)?
    } else {
        let numerator = (amount as u128)
            .checked_mul(total_shares as u128)
            .ok_or(SpectraError::MathOverflow)?;
        let result = numerator
            .checked_div(total_assets as u128)
            .ok_or(SpectraError::MathOverflow)?;
        u64::try_from(result).map_err(|_| SpectraError::MathOverflow)?
    };

    require!(shares_to_mint > 0, SpectraError::InvalidAmount);

    // Transfer USDC from user → asset_vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
            from: ctx.accounts.user_asset_account.to_account_info(),
            mint: ctx.accounts.asset_mint.to_account_info(),
            to: ctx.accounts.asset_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token_interface::transfer_checked(transfer_ctx, amount, ctx.accounts.asset_mint.decimals)?;

    // Mint vault shares to user (Token-2022)
    let vault_id_bytes = ctx.accounts.vault.vault_id.to_le_bytes();
    let seeds: &[&[u8]] = &[b"vault", vault_id_bytes.as_ref(), &[ctx.accounts.vault.bump]];
    let signer_seeds: &[&[&[u8]]] = &[seeds];

    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_2022_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.shares_mint.to_account_info(),
            to: ctx.accounts.user_shares_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token_interface::mint_to(mint_ctx, shares_to_mint)?;

    // Update vault state
    let vault = &mut ctx.accounts.vault;
    vault.total_assets = vault
        .total_assets
        .checked_add(amount)
        .ok_or(SpectraError::MathOverflow)?;
    vault.total_shares = vault
        .total_shares
        .checked_add(shares_to_mint)
        .ok_or(SpectraError::MathOverflow)?;

    emit!(DepositEvent {
        vault: vault.key(),
        user: ctx.accounts.user.key(),
        amount,
        shares_minted: shares_to_mint,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        constraint = !vault.is_paused @ SpectraError::VaultPaused,
    )]
    pub vault: Account<'info, VaultState>,

    /// CHECK: validated by address constraint against vault state
    #[account(address = vault.asset_mint)]
    pub asset_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        address = vault.shares_mint,
    )]
    pub shares_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        address = vault.asset_vault,
    )]
    pub asset_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = asset_mint,
        token::authority = user,
    )]
    pub user_asset_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = shares_mint,
        associated_token::authority = user,
        associated_token::token_program = token_2022_program,
    )]
    pub user_shares_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
