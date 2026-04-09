use anchor_lang::prelude::*;
use anchor_spl::{
    token::Token,
    token_2022::Token2022,
    token_interface::{self, Burn, Mint, TokenAccount, TransferChecked},
};

use crate::errors::SpectraError;
use crate::events::WithdrawEvent;
use crate::state::VaultState;

pub fn handler(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
    require!(shares > 0, SpectraError::InvalidAmount);

    let vault = &ctx.accounts.vault;
    require!(
        shares <= ctx.accounts.user_shares_account.amount,
        SpectraError::InsufficientShares
    );

    // usdc_to_return = (shares_burned * total_assets) / total_shares  (rounds down)
    let usdc_to_return: u64 = {
        let numerator = (shares as u128)
            .checked_mul(vault.total_assets as u128)
            .ok_or(SpectraError::MathOverflow)?;
        let result = numerator
            .checked_div(vault.total_shares as u128)
            .ok_or(SpectraError::MathOverflow)?;
        u64::try_from(result).map_err(|_| SpectraError::MathOverflow)?
    };

    require!(usdc_to_return > 0, SpectraError::InvalidAmount);
    require!(
        usdc_to_return <= ctx.accounts.asset_vault.amount,
        SpectraError::InsufficientVaultBalance
    );

    // Burn user's share tokens (Token-2022, user is authority on own account)
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_2022_program.to_account_info(),
        Burn {
            mint: ctx.accounts.shares_mint.to_account_info(),
            from: ctx.accounts.user_shares_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token_interface::burn(burn_ctx, shares)?;

    // Transfer USDC from asset_vault → user (vault PDA signs)
    let vault_id_bytes = ctx.accounts.vault.vault_id.to_le_bytes();
    let seeds: &[&[u8]] = &[b"vault", vault_id_bytes.as_ref(), &[ctx.accounts.vault.bump]];
    let signer_seeds: &[&[&[u8]]] = &[seeds];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
            from: ctx.accounts.asset_vault.to_account_info(),
            mint: ctx.accounts.asset_mint.to_account_info(),
            to: ctx.accounts.user_asset_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token_interface::transfer_checked(transfer_ctx, usdc_to_return, ctx.accounts.asset_mint.decimals)?;

    // Update vault state
    let vault = &mut ctx.accounts.vault;
    vault.total_assets = vault
        .total_assets
        .checked_sub(usdc_to_return)
        .ok_or(SpectraError::MathOverflow)?;
    vault.total_shares = vault
        .total_shares
        .checked_sub(shares)
        .ok_or(SpectraError::MathOverflow)?;

    emit!(WithdrawEvent {
        vault: vault.key(),
        user: ctx.accounts.user.key(),
        shares_burned: shares,
        amount_returned: usdc_to_return,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        constraint = !vault.is_paused @ SpectraError::VaultPaused,
    )]
    pub vault: Account<'info, VaultState>,

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
        mut,
        token::mint = shares_mint,
        token::authority = user,
    )]
    pub user_shares_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}
