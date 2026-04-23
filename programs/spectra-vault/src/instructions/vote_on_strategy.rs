use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::VoteCastEvent;
use crate::state::{StrategyProposal, UserVote, VaultState};
use crate::ix_accounts::VoteOnStrategy;

pub fn handler(
    ctx: Context<VoteOnStrategy>,
    voted_for: bool,
) -> Result<()> {
    let proposal = &mut ctx.accounts.strategy_proposal;
    let user_vote = &mut ctx.accounts.user_vote;
    let voter = &ctx.accounts.voter;

    // Check voting period is still active
    let current_time = Clock::get()?.unix_timestamp;
    require!(
        current_time < proposal.voting_ends_at,
        SpectraError::VotingEnded
    );

    // Check proposal not already decided
    require!(!proposal.is_executed, SpectraError::AlreadyExecuted);
    require!(!proposal.is_rejected, SpectraError::ProposalRejected);

    // In a real implementation, we'd check the voter's share balance
    // For now, we'll use a placeholder weight
    // TODO: Integrate with token account to get actual share balance
    let vote_weight: u64 = 1; // Placeholder - should fetch from shares_mint

    require!(vote_weight > 0, SpectraError::NoSharesToVote);

    // Record the vote
    user_vote.proposal = proposal.key();
    user_vote.voter = voter.key();
    user_vote.voted_for = voted_for;
    user_vote.vote_weight = vote_weight;
    user_vote.bump = ctx.bumps.user_vote;

    // Update proposal vote counts
    if voted_for {
        proposal.votes_for = proposal.votes_for
            .checked_add(vote_weight)
            .ok_or(SpectraError::MathOverflow)?;
    } else {
        proposal.votes_against = proposal.votes_against
            .checked_add(vote_weight)
            .ok_or(SpectraError::MathOverflow)?;
    }

    emit!(VoteCastEvent {
        vault: proposal.vault,
        proposal_id: proposal.proposal_id,
        voter: voter.key(),
        voted_for,
        vote_weight,
    });

    Ok(())
}