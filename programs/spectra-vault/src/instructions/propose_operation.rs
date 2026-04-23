use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::OperationProposedEvent;
use crate::state::{MultisigConfig, OperationType, PendingOperation, VaultState, TIMELOCK_DURATION};
use crate::ix_accounts::ProposeOperation;

pub fn handler(
    ctx: Context<ProposeOperation>,
    operation_id: u64,
    operation_type: OperationType,
) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let multisig = &ctx.accounts.multisig_config;
    let proposer = &ctx.accounts.proposer;
    let pending_op = &mut ctx.accounts.pending_operation;

    // Verify proposer is an authorized signer
    require!(
        multisig.signers.contains(&proposer.key()),
        SpectraError::UnauthorizedSigner
    );

    let current_time = Clock::get()?.unix_timestamp;

    // Initialize the pending operation
    pending_op.vault = vault.key();
    pending_op.operation_id = operation_id;
    pending_op.operation_type = operation_type;
    pending_op.proposed_at = current_time;
    pending_op.executable_at = current_time + TIMELOCK_DURATION;
    pending_op.is_executed = false;
    pending_op.is_cancelled = false;
    pending_op.approvals = vec![proposer.key()]; // Proposer automatically approves
    pending_op.bump = ctx.bumps.pending_operation;

    let operation_type_u8 = operation_type as u8;

    emit!(OperationProposedEvent {
        vault: vault.key(),
        operation_id,
        operation_type: operation_type_u8,
        proposed_at: current_time,
        executable_at: pending_op.executable_at,
        proposer: proposer.key(),
    });

    Ok(())
}