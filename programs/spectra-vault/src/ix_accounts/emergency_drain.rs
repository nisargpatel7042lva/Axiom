use anchor_lang::prelude::*;
use anchor_spl::{
    token::Token,
    token_interface::{Mint, TokenAccount},
};

use crate::errors::SpectraError;
use crate::state::VaultState;

/// Drains all USDC reserves to the vault authority after a multisig-approved
/// EmergencyWithdraw operation has paused the vault.
#[derive(Accounts)]
pub struct EmergencyDrain<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        has_one = authority @ SpectraError::Unauthorized,
        constraint = vault.is_paused @ SpectraError::VaultNotPaused,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(address = vault.asset_mint)]
    pub asset_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        address = vault.asset_vault,
    )]
    pub asset_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = asset_mint,
        token::authority = authority,
    )]
    pub authority_asset_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
