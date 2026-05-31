use anchor_lang::prelude::*;

#[error_code]
pub enum SpectraError {
    #[msg("Signer is not the vault authority")]
    Unauthorized,

    #[msg("Vault is currently paused")]
    VaultPaused,

    #[msg("Vault is not paused")]
    VaultNotPaused,

    #[msg("Deposit amount must be greater than zero")]
    InvalidAmount,

    #[msg("Insufficient shares balance for withdrawal")]
    InsufficientShares,

    #[msg("Arithmetic overflow")]
    MathOverflow,

    #[msg("Invalid strategy type (must be 0, 1, or 2)")]
    InvalidStrategyType,

    #[msg("No performance fee to collect — PPS is at or below high-water mark")]
    NoFeeToCollect,

    #[msg("min_probability must be less than or equal to max_probability")]
    InvalidProbabilityRange,

    #[msg("Vault reserves insufficient to cover withdrawal")]
    InsufficientVaultBalance,

    #[msg("Too many categories (max 8)")]
    TooManyCategories,

    #[msg("Category string too long (max 32 bytes)")]
    CategoryTooLong,

    #[msg("Performance fee basis points out of range (max 5000)")]
    InvalidFeeBps,

    // Multisig errors
    #[msg("Signer is not authorized in multisig")]
    UnauthorizedSigner,

    #[msg("Threshold must be between 1 and MAX_MULTISIG_THRESHOLD")]
    InvalidThreshold,

    #[msg("Too many signers (max 5)")]
    TooManySigners,

    #[msg("Operation already approved by this signer")]
    AlreadyApproved,

    #[msg("Operation not found or already executed/cancelled")]
    OperationNotFound,

    #[msg("Timelock has not expired yet")]
    TimelockActive,

    #[msg("Threshold not met - more approvals required")]
    ThresholdNotMet,

    #[msg("Duplicate signer in list")]
    DuplicateSigner,

    // Governance errors
    #[msg("Voting period has ended")]
    VotingEnded,

    #[msg("Voting period is still active")]
    VotingActive,

    #[msg("User already voted on this proposal")]
    AlreadyVoted,

    #[msg("Quorum not reached")]
    QuorumNotReached,

    #[msg("Proposal already executed")]
    AlreadyExecuted,

    #[msg("Proposal was rejected")]
    ProposalRejected,

    #[msg("Invalid strategy change type")]
    InvalidChangeType,

    #[msg("User has no shares to vote with")]
    NoSharesToVote,

    #[msg("New NAV exceeds 2× previous value in a single sync — possible key compromise")]
    NavBoundsExceeded,
}
