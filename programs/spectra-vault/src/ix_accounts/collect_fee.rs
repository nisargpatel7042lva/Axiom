use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};

use crate::errors::SpectraError;
use crate::state::VaultState;

#[derive(Accounts)]
pub struct CollectPerformanceFee<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        has_one = authority @ SpectraError::Unauthorized,
    )]
    pub vault: Account<'info, VaultState>,

    #[account(
        mut,
        address = vault.shares_mint,
    )]
    pub shares_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = shares_mint,
        associated_token::authority = authority,
        associated_token::token_program = token_2022_program,
    )]
    pub authority_shares_account: InterfaceAccount<'info, TokenAccount>,

    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
