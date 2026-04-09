use anchor_lang::prelude::*;
use anchor_spl::{
    token::Token,
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};

use crate::errors::SpectraError;
use crate::events::StrategyUpdateEvent;
use crate::state::{StrategyConfig, VaultState};

const SHARE_DECIMALS: u8 = 9;
const INITIAL_HWM: u64 = 1_000_000; // 1.000000 USDC per share

pub fn handler(
    ctx: Context<InitializeVault>,
    vault_id: u64,
    strategy_type: u8,
    performance_fee_bps: u16,
    min_probability: u16,
    max_probability: u16,
    max_position_pct: u16,
    lend_allocation_pct: u16,
    categories: Vec<String>,
) -> Result<()> {
    require!(strategy_type <= 2, SpectraError::InvalidStrategyType);
    require!(performance_fee_bps <= 5000, SpectraError::InvalidFeeBps);
    require!(
        min_probability <= max_probability,
        SpectraError::InvalidProbabilityRange
    );
    require!(
        categories.len() <= StrategyConfig::MAX_CATEGORIES,
        SpectraError::TooManyCategories
    );
    for cat in &categories {
        require!(
            cat.len() <= StrategyConfig::MAX_CATEGORY_LEN,
            SpectraError::CategoryTooLong
        );
    }

    let vault = &mut ctx.accounts.vault;
    vault.authority = ctx.accounts.admin.key();
    vault.asset_mint = ctx.accounts.asset_mint.key();
    vault.shares_mint = ctx.accounts.shares_mint.key();
    vault.asset_vault = ctx.accounts.asset_vault.key();
    vault.total_assets = 0;
    vault.total_shares = 0;
    vault.vault_id = vault_id;
    vault.strategy_type = strategy_type;
    vault.high_water_mark = INITIAL_HWM;
    vault.performance_fee_bps = performance_fee_bps;
    vault.is_paused = false;
    vault.bump = ctx.bumps.vault;

    let strategy = &mut ctx.accounts.strategy_config;
    strategy.vault = vault.key();
    strategy.min_probability = min_probability;
    strategy.max_probability = max_probability;
    strategy.max_position_pct = max_position_pct;
    strategy.lend_allocation_pct = lend_allocation_pct;
    strategy.categories = categories;
    strategy.is_active = true;
    strategy.bump = ctx.bumps.strategy_config;

    emit!(StrategyUpdateEvent {
        vault: vault.key(),
        strategy_type,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(
    vault_id: u64,
    strategy_type: u8,
    performance_fee_bps: u16,
    min_probability: u16,
    max_probability: u16,
    max_position_pct: u16,
    lend_allocation_pct: u16,
    categories: Vec<String>,
)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = VaultState::LEN,
        seeds = [b"vault", vault_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub vault: Box<Account<'info, VaultState>>,

    /// The deposit asset mint (USDC)
    pub asset_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"shares_mint", vault.key().as_ref()],
        bump,
        mint::decimals = SHARE_DECIMALS,
        mint::authority = vault,
        mint::token_program = token_2022_program,
    )]
    pub shares_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"asset_vault", vault.key().as_ref()],
        bump,
        token::mint = asset_mint,
        token::authority = vault,
        token::token_program = token_program,
    )]
    pub asset_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init,
        payer = admin,
        space = StrategyConfig::LEN,
        seeds = [b"strategy", vault.key().as_ref()],
        bump,
    )]
    pub strategy_config: Box<Account<'info, StrategyConfig>>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}
