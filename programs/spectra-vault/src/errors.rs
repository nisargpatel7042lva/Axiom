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
}
