use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::state::VaultState;

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

#[derive(Accounts)]
pub struct Pause<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        has_one = authority @ SpectraError::Unauthorized,
    )]
    pub vault: Account<'info, VaultState>,
}

#[derive(Accounts)]
pub struct Unpause<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        has_one = authority @ SpectraError::Unauthorized,
    )]
    pub vault: Account<'info, VaultState>,
}
