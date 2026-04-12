use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::StrategyUpdateEvent;
use crate::state::{StrategyConfig, VaultState};

pub fn handler(
    ctx: Context<InitializeStrategyConfig>,
    min_probability: u16,
    max_probability: u16,
    max_position_pct: u16,
    lend_allocation_pct: u16,
    categories: Vec<String>,
) -> Result<()> {
    require!(
        min_probability <= max_probability,
        SpectraError::InvalidProbabilityRange
    );
    require!(
        categories.len() <= StrategyConfig::MAX_CATEGORIES,
        SpectraError::TooManyCategories
    );
    for cat in &categories {
        require!(
            cat.len() <= StrategyConfig::MAX_CATEGORY_LEN,
            SpectraError::CategoryTooLong
        );
    }

    let vault = &ctx.accounts.vault;
    let strategy = &mut ctx.accounts.strategy_config;
    strategy.vault = vault.key();
    strategy.min_probability = min_probability;
    strategy.max_probability = max_probability;
    strategy.max_position_pct = max_position_pct;
    strategy.lend_allocation_pct = lend_allocation_pct;
    strategy.categories = categories;
    strategy.is_active = true;
    strategy.bump = ctx.bumps.strategy_config;

    emit!(StrategyUpdateEvent {
        vault: vault.key(),
        strategy_type: vault.strategy_type,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

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
