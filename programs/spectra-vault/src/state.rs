use anchor_lang::prelude::*;

/// Maximum number of multisig signers
pub const MAX_MULTISIG_SIGNERS: usize = 5;

/// Maximum number of approvals needed (threshold)
pub const MAX_MULTISIG_THRESHOLD: u8 = 3;

/// 24-hour timelock in seconds
pub const TIMELOCK_DURATION: i64 = 24 * 60 * 60;

/// Minimum votes required for governance quorum (20% of total shares)
pub const GOVERNANCE_QUORUM_BPS: u16 = 2000;

#[account]
pub struct VaultState {
    /// Wallet authorized to execute trades and manage the vault (strategy engine)
    pub authority: Pubkey,
    /// SPL mint of the deposit asset (USDC)
    pub asset_mint: Pubkey,
    /// Token-2022 mint for vault share tokens
    pub shares_mint: Pubkey,
    /// PDA token account holding the vault's USDC reserves
    pub asset_vault: Pubkey,
    /// Total assets under management (synced from off-chain NAV, in asset base units)
    pub total_assets: u64,
    /// Total outstanding share tokens (in share base units)
    pub total_shares: u64,
    /// Unique identifier for this vault
    pub vault_id: u64,
    /// 0 = Safe Consensus, 1 = Macro Contrarian, 2 = Yield Maximizer
    pub strategy_type: u8,
    /// Highest recorded PPS (6 decimal fixed-point, 1_000_000 = 1.0 USDC/share)
    pub high_water_mark: u64,
    /// Performance fee in basis points (e.g. 1000 = 10%)
    pub performance_fee_bps: u16,
    /// When true, deposits and withdrawals are blocked
    pub is_paused: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl VaultState {
    pub const LEN: usize = 8  // discriminator
        + 32   // authority
        + 32   // asset_mint
        + 32   // shares_mint
        + 32   // asset_vault
        + 8    // total_assets
        + 8    // total_shares
        + 8    // vault_id
        + 1    // strategy_type
        + 8    // high_water_mark
        + 2    // performance_fee_bps
        + 1    // is_paused
        + 1;   // bump
}

/// Multisig configuration for a vault
/// Replaces single authority with 2-of-3 signer model
#[account]
pub struct MultisigConfig {
    /// The vault this multisig belongs to
    pub vault: Pubkey,
    /// List of authorized signers (up to MAX_MULTISIG_SIGNERS)
    pub signers: Vec<Pubkey>,
    /// Number of approvals required to execute (e.g., 2 for 2-of-3)
    pub threshold: u8,
    /// Bump seed for PDA
    pub bump: u8,
}

impl MultisigConfig {
    pub const LEN: usize = 8   // discriminator
        + 32    // vault
        + 4 + (MAX_MULTISIG_SIGNERS * 32) // signers vec (max 5 signers)
        + 1     // threshold
        + 1;    // bump
}

/// Represents an operation waiting for multisig approval and timelock
#[account]
pub struct PendingOperation {
    /// The vault this operation belongs to
    pub vault: Pubkey,
    /// Unique operation ID within the vault
    pub operation_id: u64,
    /// Type of operation being performed
    pub operation_type: OperationType,
    /// When this operation was proposed
    pub proposed_at: i64,
    /// When this operation can be executed (after timelock)
    pub executable_at: i64,
    /// Whether operation has been executed
    pub is_executed: bool,
    /// Whether operation has been cancelled
    pub is_cancelled: bool,
    /// List of signers who have approved
    pub approvals: Vec<Pubkey>,
    /// Bump seed for PDA
    pub bump: u8,
}

impl PendingOperation {
    pub const LEN: usize = 8   // discriminator
        + 32    // vault
        + 8     // operation_id
        + 1     // operation_type
        + 8     // proposed_at
        + 8     // executable_at
        + 1     // is_executed
        + 1     // is_cancelled
        + 4 + (MAX_MULTISIG_SIGNERS * 32) // approvals vec
        + 1;    // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OperationType {
    /// Sync NAV with new total assets
    SyncNav,
    /// Pause the vault
    Pause,
    /// Unpause the vault
    Unpause,
    /// Collect performance fees
    CollectFee,
    /// Emergency withdrawal
    EmergencyWithdraw,
}

/// Strategy change proposal with on-chain governance voting
#[account]
pub struct StrategyProposal {
    /// The vault this proposal is for
    pub vault: Pubkey,
    /// Unique proposal ID
    pub proposal_id: u64,
    /// What parameter is being changed
    pub change_type: StrategyChangeType,
    /// New value (interpreted based on change_type)
    pub new_value: u64,
    /// When voting ends
    pub voting_ends_at: i64,
    /// Total votes in favor (in share units)
    pub votes_for: u64,
    /// Total votes against (in share units)
    pub votes_against: u64,
    /// Whether proposal passed and was executed
    pub is_executed: bool,
    /// Whether proposal was rejected
    pub is_rejected: bool,
    /// Bump seed for PDA
    pub bump: u8,
}

impl StrategyProposal {
    pub const LEN: usize = 8   // discriminator
        + 32    // vault
        + 8     // proposal_id
        + 1     // change_type
        + 8     // new_value
        + 8     // voting_ends_at
        + 8     // votes_for
        + 8     // votes_against
        + 1     // is_executed
        + 1     // is_rejected
        + 1;    // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum StrategyChangeType {
    /// Change probability bands (min/max)
    ProbabilityRange,
    /// Change max position percentage
    MaxPositionSize,
    /// Change lending allocation percentage
    LendingAllocation,
    /// Change allowed categories
    Categories,
}

/// Tracks a user's vote on a specific proposal
#[account]
pub struct UserVote {
    /// The proposal this vote is for
    pub proposal: Pubkey,
    /// The voter
    pub voter: Pubkey,
    /// Whether they voted for (true) or against (false)
    pub voted_for: bool,
    /// How many shares they voted with
    pub vote_weight: u64,
    /// Bump seed
    pub bump: u8,
}

impl UserVote {
    pub const LEN: usize = 8   // discriminator
        + 32    // proposal
        + 32    // voter
        + 1     // voted_for
        + 8     // vote_weight
        + 1;    // bump
}

#[account]
pub struct StrategyConfig {
    /// The vault this strategy belongs to
    pub vault: Pubkey,
    /// Minimum event probability to consider (basis points, 8500 = 85%)
    pub min_probability: u16,
    /// Maximum event probability to consider (basis points, 10000 = 100%)
    pub max_probability: u16,
    /// Max percentage of vault in a single position (basis points, 1000 = 10%)
    pub max_position_pct: u16,
    /// Percentage of idle USDC routed to Jupiter Lend (basis points, 7000 = 70%)
    pub lend_allocation_pct: u16,
    /// Allowed market categories (e.g. "crypto", "politics", "sports")
    pub categories: Vec<String>,
    /// Whether this strategy is actively trading
    pub is_active: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl StrategyConfig {
    pub const MAX_CATEGORIES: usize = 8;
    pub const MAX_CATEGORY_LEN: usize = 32;

    pub const LEN: usize = 8   // discriminator
        + 32    // vault
        + 2     // min_probability
        + 2     // max_probability
        + 2     // max_position_pct
        + 2     // lend_allocation_pct
        + 4 + (Self::MAX_CATEGORIES * (4 + Self::MAX_CATEGORY_LEN)) // categories vec
        + 1     // is_active
        + 1;    // bump
}
