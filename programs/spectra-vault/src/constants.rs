//! Values shared across account constraints and instruction logic.

/// Share token mint decimals (Token-2022).
pub const SHARE_DECIMALS: u8 = 9;

/// Initial high-water mark: 1.000000 USDC per share (6-decimal fixed-point style PPS).
pub const INITIAL_HWM: u64 = 1_000_000;

/// 10^(share_decimals - asset_decimals) for typical USDC (6) vs shares (9).
pub const DECIMAL_ADJUSTMENT: u64 = 1_000;

/// Bridges share-decimals / asset-decimals gap in PPS calculations.
pub const PPS_PRECISION: u128 = 1_000_000_000;

pub const BPS_DENOMINATOR: u128 = 10_000;
