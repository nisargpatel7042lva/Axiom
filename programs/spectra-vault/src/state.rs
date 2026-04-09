use anchor_lang::prelude::*;

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
