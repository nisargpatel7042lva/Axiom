use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH");

#[program]
pub mod spectra_vault {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        vault_id: u64,
        strategy_type: u8,
        performance_fee_bps: u16,
        min_probability: u16,
        max_probability: u16,
        max_position_pct: u16,
        lend_allocation_pct: u16,
        categories: Vec<String>,
    ) -> Result<()> {
        instructions::initialize::handler(
            ctx,
            vault_id,
            strategy_type,
            performance_fee_bps,
            min_probability,
            max_probability,
            max_position_pct,
            lend_allocation_pct,
            categories,
        )
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, shares)
    }

    pub fn sync_nav(ctx: Context<SyncNav>, new_total_assets: u64) -> Result<()> {
        instructions::sync_nav::handler(ctx, new_total_assets)
    }

    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        instructions::pause::handler(ctx)
    }

    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        instructions::pause::unpause_handler(ctx)
    }

    pub fn collect_performance_fee(ctx: Context<CollectPerformanceFee>) -> Result<()> {
        instructions::collect_fee::handler(ctx)
    }
}
