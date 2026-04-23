use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::OperationApprovedEvent;
use crate::state::{MultisigConfig, PendingOperation};
use crate::ix_accounts::ApproveOperation;

pub fn handler(ctx: Context<ApproveOperation>) -> Result<()> {
    let multisig = &ctx.accounts.multisig_config;
    let pending_op = &mut ctx.accounts.pending_operation;
    let approver = &ctx.accounts.approver;

    // Verify operation is still pending
    require!(
        !pending_op.is_executed && !pending_op.is_cancelled,
        SpectraError::OperationNotFound
    );

    // Verify approver is an authorized signer
    require!(
        multisig.signers.contains(&approver.key()),
        SpectraError::UnauthorizedSigner
    );

    // Check if already approved
    require!(
        !pending_op.approvals.contains(&approver.key()),
        SpectraError::AlreadyApproved
    );

    // Add approval
    pending_op.approvals.push(approver.key());

    let approvals_count = pending_op.approvals.len() as u8;

    emit!(OperationApprovedEvent {
        vault: pending_op.vault,
        operation_id: pending_op.operation_id,
        approver: approver.key(),
        approvals_count,
        threshold: multisig.threshold,
    });

    Ok(())
}
