use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, MintTo};

use crate::constants::{BPS_DENOMINATOR, PPS_PRECISION};
use crate::errors::SpectraError;
use crate::ix_accounts::CollectPerformanceFee;

pub fn handler(ctx: Context<CollectPerformanceFee>) -> Result<()> {
    let vault = &ctx.accounts.vault;

    require!(vault.total_shares > 0, SpectraError::NoFeeToCollect);

    let total_assets = vault.total_assets as u128;
    let total_shares = vault.total_shares as u128;
    let hwm = vault.high_water_mark as u128;
    let fee_bps = vault.performance_fee_bps as u128;

    // PPS = total_assets * 10^9 / total_shares  (6-decimal fixed-point)
    let current_pps = total_assets
        .checked_mul(PPS_PRECISION)
        .ok_or(SpectraError::MathOverflow)?
        .checked_div(total_shares)
        .ok_or(SpectraError::MathOverflow)?;

    require!(current_pps > hwm, SpectraError::NoFeeToCollect);

    // profit_per_share (in 6-decimal fixed-point)
    let profit_per_share = current_pps
        .checked_sub(hwm)
        .ok_or(SpectraError::MathOverflow)?;

    // Total profit in asset base units
    let total_profit = profit_per_share
        .checked_mul(total_shares)
        .ok_or(SpectraError::MathOverflow)?
        .checked_div(PPS_PRECISION)
        .ok_or(SpectraError::MathOverflow)?;

    // Fee amount in asset base units
    let fee_amount = total_profit
        .checked_mul(fee_bps)
        .ok_or(SpectraError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(SpectraError::MathOverflow)?;

    require!(fee_amount > 0, SpectraError::NoFeeToCollect);

    // fee_shares = fee_amount * total_shares / (total_assets - fee_amount)
    // This formula ensures the minted shares are worth exactly fee_amount after dilution
    let denominator = total_assets
        .checked_sub(fee_amount)
        .ok_or(SpectraError::MathOverflow)?;

    let fee_shares_u128 = fee_amount
        .checked_mul(total_shares)
        .ok_or(SpectraError::MathOverflow)?
        .checked_div(denominator)
        .ok_or(SpectraError::MathOverflow)?;

    let fee_shares = u64::try_from(fee_shares_u128).map_err(|_| SpectraError::MathOverflow)?;
    require!(fee_shares > 0, SpectraError::NoFeeToCollect);

    // Mint fee shares to authority (Token-2022)
    let vault_id_bytes = ctx.accounts.vault.vault_id.to_le_bytes();
    let seeds: &[&[u8]] = &[b"vault", vault_id_bytes.as_ref(), &[ctx.accounts.vault.bump]];
    let signer_seeds: &[&[&[u8]]] = &[seeds];

    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_2022_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.shares_mint.to_account_info(),
            to: ctx.accounts.authority_shares_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token_interface::mint_to(mint_ctx, fee_shares)?;

    // Update state
    let vault = &mut ctx.accounts.vault;
    vault.total_shares = vault
        .total_shares
        .checked_add(fee_shares)
        .ok_or(SpectraError::MathOverflow)?;

    // Set HWM to current PPS (post-dilution PPS equals pre-dilution PPS by construction)
    let new_pps = (vault.total_assets as u128)
        .checked_mul(PPS_PRECISION)
        .ok_or(SpectraError::MathOverflow)?
        .checked_div(vault.total_shares as u128)
        .ok_or(SpectraError::MathOverflow)?;
    vault.high_water_mark = u64::try_from(new_pps).map_err(|_| SpectraError::MathOverflow)?;

    Ok(())
}
