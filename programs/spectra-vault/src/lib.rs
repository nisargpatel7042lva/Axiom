use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod ix_accounts;
pub mod instructions;
pub mod state;

use ix_accounts::*;
use state::*;

declare_id!("JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH");

#[program]
pub mod spectra_vault {
    use super::*;

    pub fn bootstrap_vault(
        ctx: Context<BootstrapVault>,
        vault_id: u64,
        strategy_type: u8,
        performance_fee_bps: u16,
    ) -> Result<()> {
        instructions::initialize::bootstrap_vault_handler(
            ctx,
            vault_id,
            strategy_type,
            performance_fee_bps,
        )
    }

    pub fn create_asset_vault(ctx: Context<CreateAssetVault>) -> Result<()> {
        instructions::initialize::create_asset_vault_handler(ctx)
    }

    pub fn initialize_strategy_config(
        ctx: Context<InitializeStrategyConfig>,
        min_probability: u16,
        max_probability: u16,
        max_position_pct: u16,
        lend_allocation_pct: u16,
        categories: Vec<String>,
    ) -> Result<()> {
        instructions::initialize_strategy::handler(
            ctx,
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

    // Multisig instructions
    pub fn initialize_multisig(
        ctx: Context<InitializeMultisig>,
        signers: Vec<Pubkey>,
        threshold: u8,
    ) -> Result<()> {
        instructions::initialize_multisig::handler(ctx, signers, threshold)
    }

    pub fn propose_operation(
        ctx: Context<ProposeOperation>,
        operation_id: u64,
        operation_type: OperationType,
    ) -> Result<()> {
        instructions::propose_operation::handler(ctx, operation_id, operation_type)
    }

    pub fn approve_operation(ctx: Context<ApproveOperation>) -> Result<()> {
        instructions::approve_operation::handler(ctx)
    }

    pub fn execute_operation(ctx: Context<ExecuteOperation>) -> Result<()> {
        instructions::execute_operation::handler(ctx)
    }

    pub fn cancel_operation(ctx: Context<CancelOperation>) -> Result<()> {
        instructions::cancel_operation::handler(ctx)
    }

    // Governance instructions
    pub fn propose_strategy_change(
        ctx: Context<ProposeStrategyChange>,
        proposal_id: u64,
        change_type: StrategyChangeType,
        new_value: u64,
        voting_duration_seconds: i64,
    ) -> Result<()> {
        instructions::propose_strategy_change::handler(
            ctx,
            proposal_id,
            change_type,
            new_value,
            voting_duration_seconds,
        )
    }

    pub fn vote_on_strategy(
        ctx: Context<VoteOnStrategy>,
        voted_for: bool,
    ) -> Result<()> {
        instructions::vote_on_strategy::handler(ctx, voted_for)
    }

    pub fn execute_strategy_change(ctx: Context<ExecuteStrategyChange>) -> Result<()> {
        instructions::execute_strategy_change::handler(ctx)
    }
}
