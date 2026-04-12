use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::state::{StrategyConfig, VaultState};

#[derive(Accounts)]
pub struct InitializeStrategyConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        constraint = vault.authority == admin.key() @ SpectraError::Unauthorized,
    )]
    pub vault: Box<Account<'info, VaultState>>,

    #[account(
        init,
        payer = admin,
        space = StrategyConfig::LEN,
        seeds = [b"strategy", vault.key().as_ref()],
        bump,
    )]
    pub strategy_config: Box<Account<'info, StrategyConfig>>,

    pub system_program: Program<'info, System>,
}
