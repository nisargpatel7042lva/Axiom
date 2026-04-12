use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::ix_accounts::{Pause, Unpause};

pub fn handler(ctx: Context<Pause>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    require!(!vault.is_paused, SpectraError::VaultPaused);
    vault.is_paused = true;
    Ok(())
}

pub fn unpause_handler(ctx: Context<Unpause>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    require!(vault.is_paused, SpectraError::VaultNotPaused);
    vault.is_paused = false;
    Ok(())
}
