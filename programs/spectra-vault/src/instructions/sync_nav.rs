use anchor_lang::prelude::*;

use crate::constants::PPS_PRECISION;
use crate::errors::SpectraError;
use crate::events::NavSyncEvent;
use crate::ix_accounts::SyncNav;

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
