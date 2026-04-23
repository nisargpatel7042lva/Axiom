use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::MultisigInitializedEvent;
use crate::state::{MultisigConfig, VaultState, MAX_MULTISIG_SIGNERS, MAX_MULTISIG_THRESHOLD};
use crate::ix_accounts::InitializeMultisig;

pub fn handler(
    ctx: Context<InitializeMultisig>,
    signers: Vec<Pubkey>,
    threshold: u8,
) -> Result<()> {
    // Validate inputs
    require!(
        signers.len() <= MAX_MULTISIG_SIGNERS,
        SpectraError::TooManySigners
    );
    require!(
        threshold > 0 && threshold <= MAX_MULTISIG_THRESHOLD,
        SpectraError::InvalidThreshold
    );
    require!(
        threshold as usize <= signers.len(),
        SpectraError::InvalidThreshold
    );

    // Check for duplicates
    let mut unique_signers = signers.clone();
    unique_signers.sort();
    unique_signers.dedup();
    require!(
        unique_signers.len() == signers.len(),
        SpectraError::DuplicateSigner
    );

    let vault = &ctx.accounts.vault;
    let multisig = &mut ctx.accounts.multisig_config;

    multisig.vault = vault.key();
    multisig.signers = signers.clone();
    multisig.threshold = threshold;
    multisig.bump = ctx.bumps.multisig_config;

    emit!(MultisigInitializedEvent {
        vault: vault.key(),
        signers,
        threshold,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
