use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::state::VaultState;

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
