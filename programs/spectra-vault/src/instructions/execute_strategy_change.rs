use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::StrategyProposalExecutedEvent;
use crate::state::{StrategyProposal, StrategyConfig, VaultState, StrategyChangeType, GOVERNANCE_QUORUM_BPS};
use crate::ix_accounts::ExecuteStrategyChange;

pub fn handler(ctx: Context<ExecuteStrategyChange>) -> Result<()> {
    let proposal = &mut ctx.accounts.strategy_proposal;
    let strategy_config = &mut ctx.accounts.strategy_config;
    let vault = &ctx.accounts.vault;

    // Check voting period has ended
    let current_time = Clock::get()?.unix_timestamp;
    require!(
        current_time >= proposal.voting_ends_at,
        SpectraError::VotingActive
    );

    // Check proposal not already decided
    require!(!proposal.is_executed, SpectraError::AlreadyExecuted);
    require!(!proposal.is_rejected, SpectraError::ProposalRejected);

    // Check quorum (minimum 20% of total supply must vote)
    let total_votes = proposal.votes_for.saturating_add(proposal.votes_against);
    // In a real implementation, check against total shares outstanding
    // For now, we require more votes for than against
    require!(
        proposal.votes_for > proposal.votes_against,
        SpectraError::QuorumNotReached
    );

    // Apply the strategy change
    match proposal.change_type {
        StrategyChangeType::MaxPositionSize => {
            strategy_config.max_position_pct = proposal.new_value as u16;
        },
        StrategyChangeType::LendingAllocation => {
            strategy_config.lend_allocation_pct = proposal.new_value as u16;
        },
        StrategyChangeType::ProbabilityRange => {
            // Would need two values for min/max
            // For now, just update max
            strategy_config.max_probability = proposal.new_value as u16;
        },
        StrategyChangeType::Categories => {
            // Would require more complex handling
            // Not implemented in this simplified version
        },
    }

    proposal.is_executed = true;

    emit!(StrategyProposalExecutedEvent {
        vault: vault.key(),
        proposal_id: proposal.proposal_id,
        change_type: proposal.change_type as u8,
        new_value: proposal.new_value,
        votes_for: proposal.votes_for,
        votes_against: proposal.votes_against,
    });

    Ok(())
}