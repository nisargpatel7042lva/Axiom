use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::NavSyncEvent;
use crate::state::VaultState;

/// 10^9 — bridges the share-decimals / asset-decimals gap in PPS calculation
const PPS_PRECISION: u128 = 1_000_000_000;

pub fn handler(ctx: Context<SyncNav>, new_total_assets: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let old_total_assets = vault.total_assets;

    vault.total_assets = new_total_assets;

    let pps: u64 = if vault.total_shares > 0 {
        let num = (new_total_assets as u128)
            .checked_mul(PPS_PRECISION)
            .ok_or(SpectraError::MathOverflow)?;
        let result = num
            .checked_div(vault.total_shares as u128)
            .ok_or(SpectraError::MathOverflow)?;
        u64::try_from(result).map_err(|_| SpectraError::MathOverflow)?
    } else {
        0
    };

    emit!(NavSyncEvent {
        vault: vault.key(),
        old_total_assets,
        new_total_assets,
        pps,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SyncNav<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        has_one = authority @ SpectraError::Unauthorized,
    )]
    pub vault: Account<'info, VaultState>,
}
