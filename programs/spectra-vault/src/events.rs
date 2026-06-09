use anchor_lang::prelude::*;

#[event]
pub struct DepositEvent {
    pub vault: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub shares_minted: u64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub vault: Pubkey,
    pub user: Pubkey,
    pub shares_burned: u64,
    pub amount_returned: u64,
    pub timestamp: i64,
}

#[event]
pub struct NavSyncEvent {
    pub vault: Pubkey,
    pub old_total_assets: u64,
    pub new_total_assets: u64,
    pub pps: u64,
    pub timestamp: i64,
}

#[event]
pub struct StrategyUpdateEvent {
    pub vault: Pubkey,
    pub strategy_type: u8,
    pub timestamp: i64,
}

// Multisig events
#[event]
pub struct MultisigInitializedEvent {
    pub vault: Pubkey,
    pub signers: Vec<Pubkey>,
    pub threshold: u8,
    pub timestamp: i64,
}

#[event]
pub struct OperationProposedEvent {
    pub vault: Pubkey,
    pub operation_id: u64,
    pub operation_type: u8,
    pub proposed_at: i64,
    pub executable_at: i64,
    pub proposer: Pubkey,
}

#[event]
pub struct OperationApprovedEvent {
    pub vault: Pubkey,
    pub operation_id: u64,
    pub approver: Pubkey,
    pub approvals_count: u8,
    pub threshold: u8,
}

#[event]
pub struct OperationExecutedEvent {
    pub vault: Pubkey,
    pub operation_id: u64,
    pub operation_type: u8,
    pub executed_at: i64,
}

#[event]
pub struct OperationCancelledEvent {
    pub vault: Pubkey,
    pub operation_id: u64,
    pub cancelled_by: Pubkey,
    pub timestamp: i64,
}

// Emergency events
#[event]
pub struct EmergencyDrainEvent {
    pub vault: Pubkey,
    pub amount_drained: u64,
    pub destination: Pubkey,
    pub timestamp: i64,
}

// Governance events
#[event]
pub struct StrategyProposalCreatedEvent {
    pub vault: Pubkey,
    pub proposal_id: u64,
    pub change_type: u8,
    pub new_value: u64,
    pub voting_ends_at: i64,
}

#[event]
pub struct VoteCastEvent {
    pub vault: Pubkey,
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub voted_for: bool,
    pub vote_weight: u64,
}

#[event]
pub struct StrategyProposalExecutedEvent {
    pub vault: Pubkey,
    pub proposal_id: u64,
    pub change_type: u8,
    pub new_value: u64,
    pub votes_for: u64,
    pub votes_against: u64,
}
