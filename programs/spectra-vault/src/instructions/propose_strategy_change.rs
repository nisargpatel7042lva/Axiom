use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::StrategyProposalCreatedEvent;
use crate::state::{StrategyProposal, VaultState, StrategyChangeType, GOVERNANCE_QUORUM_BPS};
use crate::ix_accounts::ProposeStrategyChange;

pub fn handler(
    ctx: Context<ProposeStrategyChange>,
    proposal_id: u64,
    change_type: StrategyChangeType,
    new_value: u64,
    voting_duration_seconds: i64,
) -> Result<()> {
    require!(
        voting_duration_seconds >= 24 * 60 * 60, // Minimum 24 hour voting period
        SpectraError::InvalidChangeType
    );

    let vault = &ctx.accounts.vault;
    let proposal = &mut ctx.accounts.strategy_proposal;
    let current_time = Clock::get()?.unix_timestamp;

    proposal.vault = vault.key();
    proposal.proposal_id = proposal_id;
    proposal.change_type = change_type;
    proposal.new_value = new_value;
    proposal.voting_ends_at = current_time + voting_duration_seconds;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.is_executed = false;
    proposal.is_rejected = false;
    proposal.bump = ctx.bumps.strategy_proposal;

    emit!(StrategyProposalCreatedEvent {
        vault: vault.key(),
        proposal_id,
        change_type: change_type as u8,
        new_value,
        voting_ends_at: proposal.voting_ends_at,
    });

    Ok(())
}