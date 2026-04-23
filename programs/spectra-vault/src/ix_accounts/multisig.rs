use anchor_lang::prelude::*;

use crate::state::{VaultState, MultisigConfig, PendingOperation, StrategyProposal, UserVote, StrategyConfig};

/// Accounts for initializing multisig config
#[derive(Accounts)]
pub struct InitializeMultisig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The admin/authority initializing the multisig
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        init,
        payer = payer,
        space = 8 + MultisigConfig::LEN,
        seeds = [b"multisig", vault.key().as_ref()],
        bump,
    )]
    pub multisig_config: Account<'info, MultisigConfig>,

    pub system_program: Program<'info, System>,
}

/// Accounts for proposing an operation
#[derive(Accounts)]
#[instruction(operation_id: u64, operation_type: crate::state::OperationType)]
pub struct ProposeOperation<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Must be one of the authorized signers
    pub proposer: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        seeds = [b"multisig", vault.key().as_ref()],
        bump = multisig_config.bump,
    )]
    pub multisig_config: Account<'info, MultisigConfig>,

    #[account(
        init,
        payer = payer,
        space = 8 + PendingOperation::LEN,
        seeds = [b"operation", vault.key().as_ref(), operation_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub pending_operation: Account<'info, PendingOperation>,

    pub system_program: Program<'info, System>,
}

/// Accounts for approving an operation
#[derive(Accounts)]
pub struct ApproveOperation<'info> {
    /// Must be one of the authorized signers
    pub approver: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        seeds = [b"multisig", vault.key().as_ref()],
        bump = multisig_config.bump,
    )]
    pub multisig_config: Account<'info, MultisigConfig>,

    #[account(
        mut,
        seeds = [b"operation", vault.key().as_ref(), pending_operation.operation_id.to_le_bytes().as_ref()],
        bump = pending_operation.bump,
    )]
    pub pending_operation: Account<'info, PendingOperation>,
}

/// Accounts for executing an operation
#[derive(Accounts)]
pub struct ExecuteOperation<'info> {
    #[account(mut)]
    pub executor: Signer<'info>,

    #[account(
        seeds = [b"multisig", vault.key().as_ref()],
        bump = multisig_config.bump,
    )]
    pub multisig_config: Account<'info, MultisigConfig>,

    #[account(
        mut,
        seeds = [b"operation", vault.key().as_ref(), pending_operation.operation_id.to_le_bytes().as_ref()],
        bump = pending_operation.bump,
    )]
    pub pending_operation: Account<'info, PendingOperation>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,
}

/// Accounts for cancelling an operation
#[derive(Accounts)]
pub struct CancelOperation<'info> {
    /// Must be one of the authorized signers
    pub canceller: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        seeds = [b"multisig", vault.key().as_ref()],
        bump = multisig_config.bump,
    )]
    pub multisig_config: Account<'info, MultisigConfig>,

    #[account(
        mut,
        seeds = [b"operation", vault.key().as_ref(), pending_operation.operation_id.to_le_bytes().as_ref()],
        bump = pending_operation.bump,
    )]
    pub pending_operation: Account<'info, PendingOperation>,
}

/// Accounts for proposing a strategy change
#[derive(Accounts)]
#[instruction(proposal_id: u64, change_type: crate::state::StrategyChangeType, new_value: u64, voting_duration_seconds: i64)]
pub struct ProposeStrategyChange<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Must be an authorized multisig signer
    pub proposer: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        seeds = [b"multisig", vault.key().as_ref()],
        bump = multisig_config.bump,
    )]
    pub multisig_config: Account<'info, MultisigConfig>,

    #[account(
        init,
        payer = payer,
        space = 8 + StrategyProposal::LEN,
        seeds = [b"proposal", vault.key().as_ref(), proposal_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub strategy_proposal: Account<'info, StrategyProposal>,

    pub system_program: Program<'info, System>,
}

/// Accounts for voting on a strategy change
#[derive(Accounts)]
#[instruction(voted_for: bool)]
pub struct VoteOnStrategy<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The voter (must hold vault shares)
    pub voter: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"proposal", vault.key().as_ref(), strategy_proposal.proposal_id.to_le_bytes().as_ref()],
        bump = strategy_proposal.bump,
    )]
    pub strategy_proposal: Account<'info, StrategyProposal>,

    #[account(
        init,
        payer = payer,
        space = 8 + UserVote::LEN,
        seeds = [b"user_vote", strategy_proposal.key().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub user_vote: Account<'info, UserVote>,

    pub system_program: Program<'info, System>,
}

/// Accounts for executing a strategy change after voting
#[derive(Accounts)]
pub struct ExecuteStrategyChange<'info> {
    #[account(mut)]
    pub executor: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"proposal", vault.key().as_ref(), strategy_proposal.proposal_id.to_le_bytes().as_ref()],
        bump = strategy_proposal.bump,
    )]
    pub strategy_proposal: Account<'info, StrategyProposal>,

    #[account(
        mut,
        seeds = [b"strategy", vault.key().as_ref()],
        bump = strategy_config.bump,
    )]
    pub strategy_config: Account<'info, StrategyConfig>,
}