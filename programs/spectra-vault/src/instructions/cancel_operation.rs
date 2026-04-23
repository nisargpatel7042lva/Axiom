use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::OperationCancelledEvent;
use crate::state::{MultisigConfig, PendingOperation};
use crate::ix_accounts::CancelOperation;

pub fn handler(ctx: Context<CancelOperation>) -> Result<()> {
    let multisig = &ctx.accounts.multisig_config;
    let pending_op = &mut ctx.accounts.pending_operation;
    let canceller = &ctx.accounts.canceller;

    // Verify operation is still pending
    require!(
        !pending_op.is_executed && !pending_op.is_cancelled,
        SpectraError::OperationNotFound
    );

    // Verify canceller is an authorized signer (any signer can cancel)
    require!(
        multisig.signers.contains(&canceller.key()),
        SpectraError::UnauthorizedSigner
    );

    pending_op.is_cancelled = true;

    emit!(OperationCancelledEvent {
        vault: pending_op.vault,
        operation_id: pending_op.operation_id,
        cancelled_by: canceller.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}