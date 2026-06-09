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

    // Require 20% quorum of outstanding shares, then simple majority.
    let total_votes = proposal.votes_for.saturating_add(proposal.votes_against);
    let total_shares = vault.total_shares;
    if total_shares > 0 {
        let min_quorum = (total_shares as u128)
            .checked_mul(GOVERNANCE_QUORUM_BPS as u128)
            .ok_or(SpectraError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(SpectraError::MathOverflow)?;
        require!(
            (total_votes as u128) >= min_quorum,
            SpectraError::QuorumNotReached
        );
    }
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
            // new_value encodes both bounds: lower 16 bits = min, upper 16 bits = max.
            // Caller sets new_value = (max_prob as u64) << 16 | (min_prob as u64).
            let min_prob = (proposal.new_value & 0xFFFF) as u16;
            let max_prob = ((proposal.new_value >> 16) & 0xFFFF) as u16;
            require!(min_prob <= max_prob, SpectraError::InvalidProbabilityRange);
            strategy_config.min_probability = min_prob;
            strategy_config.max_probability = max_prob;
        },
        StrategyChangeType::Categories => {
            // new_value is a bitmask over 8 fixed categories (bit 0 = LSB).
            // Categories: crypto | politics | sports | finance |
            //             entertainment | science | geopolitics | technology
            const CATEGORY_NAMES: [&str; 8] = [
                "crypto", "politics", "sports", "finance",
                "entertainment", "science", "geopolitics", "technology",
            ];
            let mask = proposal.new_value as u8;
            require!(mask != 0, SpectraError::TooManyCategories);
            let new_cats: Vec<String> = CATEGORY_NAMES
                .iter()
                .enumerate()
                .filter(|(i, _)| mask & (1u8 << i) != 0)
                .map(|(_, name)| name.to_string())
                .collect();
            strategy_config.categories = new_cats;
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