use anchor_lang::prelude::*;

use crate::constants::PPS_PRECISION;
use crate::errors::SpectraError;
use crate::events::NavSyncEvent;
use crate::ix_accounts::SyncNav;

pub fn handler(ctx: Context<SyncNav>, new_total_assets: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let old_total_assets = vault.total_assets;

    // Reject any single-sync increase beyond 2× the current NAV.
    // A legitimate vault cannot double its liquid assets (idle USDC + lend)
    // in one 30-minute cycle. A larger jump is a strong signal of a compromised
    // authority key being used to inflate NAV before a manipulated deposit.
    if old_total_assets > 0 {
        let max_allowed = old_total_assets
            .checked_mul(2)
            .ok_or(SpectraError::MathOverflow)?;
        require!(new_total_assets <= max_allowed, SpectraError::NavBoundsExceeded);
    }

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

    // Advance high-water mark whenever PPS reaches a new peak.
    // collect_fee uses this to gate performance fee collection —
    // without updating it here, fees can be charged on the same
    // gains repeatedly across NAV sync cycles.
    if pps > vault.high_water_mark {
        vault.high_water_mark = pps;
    }

    emit!(NavSyncEvent {
        vault: vault.key(),
        old_total_assets,
        new_total_assets,
        pps,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
