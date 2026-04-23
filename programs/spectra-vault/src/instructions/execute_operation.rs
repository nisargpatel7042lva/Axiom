use anchor_lang::prelude::*;

use crate::errors::SpectraError;
use crate::events::{OperationExecutedEvent, NavSyncEvent};
use crate::state::{MultisigConfig, PendingOperation, VaultState, OperationType};
use crate::constants::PPS_PRECISION;
use crate::ix_accounts::ExecuteOperation;

pub fn handler(ctx: Context<ExecuteOperation>) -> Result<()> {
    let multisig = &ctx.accounts.multisig_config;
    let pending_op = &mut ctx.accounts.pending_operation;
    let vault = &mut ctx.accounts.vault;

    // Verify operation is still pending
    require!(
        !pending_op.is_executed && !pending_op.is_cancelled,
        SpectraError::OperationNotFound
    );

    // Check threshold met
    require!(
        pending_op.approvals.len() >= multisig.threshold as usize,
        SpectraError::ThresholdNotMet
    );

    // Check timelock expired
    let current_time = Clock::get()?.unix_timestamp;
    require!(
        current_time >= pending_op.executable_at,
        SpectraError::TimelockActive
    );

    // Execute based on operation type
    match pending_op.operation_type {
        OperationType::SyncNav => {
            // For SyncNav, new_total_assets is stored in operation_id
            let new_total_assets = pending_op.operation_id; // Using operation_id as a workaround for data
            execute_sync_nav(vault, new_total_assets)?;
        },
        OperationType::Pause => {
            vault.is_paused = true;
        },
        OperationType::Unpause => {
            vault.is_paused = false;
        },
        OperationType::CollectFee => {
            // Collect fee logic would go here
            // For now, we just mark as executed
        },
        OperationType::EmergencyWithdraw => {
            // Emergency withdrawal logic
            // Would require additional accounts
        },
    }

    pending_op.is_executed = true;

    emit!(OperationExecutedEvent {
        vault: vault.key(),
        operation_id: pending_op.operation_id,
        operation_type: pending_op.operation_type as u8,
        executed_at: current_time,
    });

    Ok(())
}

fn execute_sync_nav(vault: &mut Account<VaultState>, new_total_assets: u64) -> Result<()> {
    let old_total_assets = vault.total_assets;
    vault.total_assets = new_total_assets;

    let pps: u64 = if vault.total_shares > 0 {
        let num = (new_total_assets as u128)
            .checked_mul(PPS_PRECISION)
            .ok_or(SpectraError::MathOverflow)?;
        let result = num
            .checked_div(vault.total_shares as u128)
            .ok_or(SpectraError::MathOverflow)?;
        u64::try_from(result).map_err(|_| SpectraError::MathOverflow)?
    } else {
        0
    };

    emit!(NavSyncEvent {
        vault: vault.key(),
        old_total_assets,
        new_total_assets,
        pps,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}