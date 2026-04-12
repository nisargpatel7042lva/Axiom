use anchor_lang::prelude::*;

use crate::constants::INITIAL_HWM;
use crate::errors::SpectraError;
use crate::ix_accounts::{BootstrapVault, CreateAssetVault};

/// Step 1/2: vault state + Token-2022 shares mint. Does not include legacy
/// `token_program` on the account struct to keep BPF stack under 4KiB.
pub fn bootstrap_vault_handler(
    ctx: Context<BootstrapVault>,
    vault_id: u64,
    strategy_type: u8,
    performance_fee_bps: u16,
) -> Result<()> {
    require!(strategy_type <= 2, SpectraError::InvalidStrategyType);
    require!(performance_fee_bps <= 5000, SpectraError::InvalidFeeBps);

    let vault = &mut ctx.accounts.vault;
    let (asset_vault_pda, _) = Pubkey::find_program_address(
        &[b"asset_vault", vault.key().as_ref()],
        ctx.program_id,
    );

    vault.authority = ctx.accounts.admin.key();
    vault.asset_mint = ctx.accounts.asset_mint.key();
    vault.shares_mint = ctx.accounts.shares_mint.key();
    vault.asset_vault = asset_vault_pda;
    vault.total_assets = 0;
    vault.total_shares = 0;
    vault.vault_id = vault_id;
    vault.strategy_type = strategy_type;
    vault.high_water_mark = INITIAL_HWM;
    vault.performance_fee_bps = performance_fee_bps;
    vault.is_paused = false;
    vault.bump = ctx.bumps.vault;

    Ok(())
}

/// Step 2/2: SPL token account holding USDC reserves (legacy Token program).
pub fn create_asset_vault_handler(ctx: Context<CreateAssetVault>) -> Result<()> {
    let _vault = &ctx.accounts.vault;
    Ok(())
}
