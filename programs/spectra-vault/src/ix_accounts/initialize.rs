use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint as LegacyMint, Token, TokenAccount},
    token_2022::Token2022,
    token_interface::Mint as IfaceMint,
};

use crate::constants::SHARE_DECIMALS;
use crate::errors::SpectraError;
use crate::state::VaultState;

#[derive(Accounts)]
#[instruction(vault_id: u64)]
pub struct BootstrapVault<'info> {
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

    pub asset_mint: Box<Account<'info, LegacyMint>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"shares_mint", vault.key().as_ref()],
        bump,
        mint::decimals = SHARE_DECIMALS,
        mint::authority = vault,
        mint::token_program = token_2022_program,
    )]
    pub shares_mint: Box<InterfaceAccount<'info, IfaceMint>>,

    pub token_2022_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAssetVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        constraint = vault.authority == admin.key() @ SpectraError::Unauthorized,
    )]
    pub vault: Box<Account<'info, VaultState>>,

    #[account(address = vault.asset_mint)]
    pub asset_mint: Box<Account<'info, LegacyMint>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"asset_vault", vault.key().as_ref()],
        bump,
        token::mint = asset_mint,
        token::authority = vault,
        token::token_program = token_program,
    )]
    pub asset_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
