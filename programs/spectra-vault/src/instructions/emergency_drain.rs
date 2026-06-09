use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, TransferChecked};

use crate::errors::SpectraError;
use crate::events::EmergencyDrainEvent;
use crate::ix_accounts::EmergencyDrain;

/// Transfers all USDC reserves out of the vault to the authority wallet.
///
/// Requires the vault to already be paused — enforced either through the normal
/// pause instruction or via a multisig-approved EmergencyWithdraw operation.
/// After the drain, total_assets is zeroed so NAV accounting stays consistent.
pub fn handler(ctx: Context<EmergencyDrain>) -> Result<()> {
    let amount = ctx.accounts.asset_vault.amount;
    require!(amount > 0, SpectraError::InvalidAmount);

    let vault_id_bytes = ctx.accounts.vault.vault_id.to_le_bytes();
    let seeds: &[&[u8]] = &[b"vault", vault_id_bytes.as_ref(), &[ctx.accounts.vault.bump]];
    let signer_seeds: &[&[&[u8]]] = &[seeds];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
            from: ctx.accounts.asset_vault.to_account_info(),
            mint: ctx.accounts.asset_mint.to_account_info(),
            to: ctx.accounts.authority_asset_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token_interface::transfer_checked(transfer_ctx, amount, ctx.accounts.asset_mint.decimals)?;

    let vault = &mut ctx.accounts.vault;
    vault.total_assets = 0;

    emit!(EmergencyDrainEvent {
        vault: vault.key(),
        amount_drained: amount,
        destination: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
