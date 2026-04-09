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
