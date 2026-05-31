import { jupiterLend } from "../services/jupiter-lend.js";
import { getTokenBalance } from "../services/solana.js";
import { getAllVaultConfigs, CONFIG } from "../config.js";
import { deriveVaultPda, deriveAssetVaultPda } from "../services/vault-contract.js";
import { createLogger } from "../utils/logger.js";
import type { LendingPosition, VaultStrategyType } from "../types/index.js";

const log = createLogger("yield-router");

// Fraction of each vault's liquid NAV that must remain as idle USDC at all times.
// This guarantees users can always withdraw up to this fraction without waiting
// for lend positions to unwind.
const WITHDRAWAL_BUFFER_PCT = parseFloat(process.env.WITHDRAWAL_BUFFER_PCT ?? "0.20");

const lendingState = new Map<string, LendingPosition>();

export async function runYieldRouter(): Promise<void> {
  log.info("Routing idle USDC to Jupiter Lend...");

  const vaultConfigs = getAllVaultConfigs();

  // Step 1 — Read per-vault idle USDC (each vault has its own on-chain PDA vault).
  const vaultIdle = new Map<string, number>();
  for (const v of vaultConfigs) {
    vaultIdle.set(v.strategyType, await getIdleUsdc(v.id));
  }

  // Step 2 — Single global read of the Jupiter Lend balance.
  // Jupiter Lend is wallet-level (not per-vault), so one call gives the
  // total balance for all vaults combined.
  const actualLendTotal = await jupiterLend.getEarnBalance();
  log.info(`Global Jupiter Lend balance: $${actualLendTotal.toFixed(2)}`);

  // Step 3 — Reconcile per-vault tracked allocations against actual balance.
  // The actual balance may drift above tracked totals due to interest accrual.
  // Distribute any surplus proportionally so each vault benefits from yield.
  reconcileTrackedVsActual(vaultConfigs.map((v) => v.strategyType), actualLendTotal);

  // Step 4 — Compute per-vault lend targets, capped by the withdrawal buffer.
  const targets = new Map<string, number>();
  let totalTarget = 0;

  for (const v of vaultConfigs) {
    const idle = vaultIdle.get(v.strategyType) ?? 0;
    const currentLend = lendingState.get(v.strategyType)?.currentBalance ?? 0;
    const liquidNav = idle + currentLend;

    // Never lend more than (1 - buffer) of liquid NAV so withdrawals always succeed.
    const maxLendable = Math.max(0, liquidNav * (1 - WITHDRAWAL_BUFFER_PCT));
    const rawTarget = liquidNav * v.lendAllocationPct;
    const target = Math.min(rawTarget, maxLendable);

    targets.set(v.strategyType, target);
    totalTarget += target;

    log.info(
      `[${v.name}] idle=$${idle.toFixed(2)} lend=$${currentLend.toFixed(2)} ` +
        `target=$${target.toFixed(2)} buffer=${(WITHDRAWAL_BUFFER_PCT * 100).toFixed(0)}%`,
    );
  }

  // Step 5 — Issue a single deposit or withdraw to close the gap.
  // One operation per cycle avoids competing rebalances between vaults and
  // prevents the same lend balance from being double-counted.
  const delta = totalTarget - actualLendTotal;

  if (delta > 100) {
    // Find the vault with the most excess idle USDC and borrow from it first.
    for (const v of vaultConfigs) {
      const idle = vaultIdle.get(v.strategyType) ?? 0;
      const currentLend = lendingState.get(v.strategyType)?.currentBalance ?? 0;
      const target = targets.get(v.strategyType) ?? 0;
      const vaultDelta = target - currentLend;

      // Only deposit if this vault has meaningful deficit and enough idle USDC
      // to cover the deposit while still keeping the withdrawal buffer.
      const minIdle = (idle + currentLend) * WITHDRAWAL_BUFFER_PCT;
      if (vaultDelta > 50 && idle - vaultDelta > minIdle) {
        log.info(`[${v.name}] Depositing $${vaultDelta.toFixed(2)} to Jupiter Lend`);
        try {
          await jupiterLend.sendDepositToEarn(vaultDelta);
          updateLendingState(v.strategyType, currentLend + vaultDelta);
        } catch (err) {
          log.error(`[${v.name}] Lend deposit failed`, err);
        }
        break; // One deposit per cycle
      }
    }
  } else if (delta < -100) {
    // Withdraw excess from the vault that's furthest above its target.
    for (const v of vaultConfigs) {
      const currentLend = lendingState.get(v.strategyType)?.currentBalance ?? 0;
      const target = targets.get(v.strategyType) ?? 0;
      const excess = currentLend - target;

      if (excess > 50) {
        const withdrawAmt = Math.min(excess, currentLend);
        log.info(`[${v.name}] Withdrawing $${withdrawAmt.toFixed(2)} from Jupiter Lend`);
        try {
          await jupiterLend.sendWithdrawFromEarn(withdrawAmt);
          updateLendingState(v.strategyType, currentLend - withdrawAmt);
        } catch (err) {
          log.error(`[${v.name}] Lend withdraw failed`, err);
        }
        break; // One withdrawal per cycle
      }
    }
  } else {
    log.info(`Global lend on target (actual $${actualLendTotal.toFixed(2)}, target $${totalTarget.toFixed(2)})`);
  }

  log.info("Yield routing complete");
}

/**
 * Distribute interest accrual proportionally across vaults.
 * If the actual lend balance exceeds the sum of tracked allocations (because
 * interest accrued), scale every vault's tracked balance up by the same ratio
 * so no vault unfairly captures all the yield.
 */
function reconcileTrackedVsActual(vaultIds: VaultStrategyType[], actualTotal: number): void {
  const trackedTotal = vaultIds.reduce(
    (sum, id) => sum + (lendingState.get(id)?.currentBalance ?? 0),
    0,
  );

  if (trackedTotal <= 0) {
    // No tracked state yet — distribute evenly so the first cycle has a baseline.
    if (actualTotal > 0) {
      const perVault = actualTotal / vaultIds.length;
      for (const id of vaultIds) {
        updateLendingState(id, perVault);
      }
      log.info(`Initialized per-vault lend tracking ($${perVault.toFixed(2)} each from $${actualTotal.toFixed(2)} actual)`);
    }
    return;
  }

  if (Math.abs(actualTotal - trackedTotal) < 1) return; // No meaningful drift

  const ratio = actualTotal / trackedTotal;
  for (const id of vaultIds) {
    const state = lendingState.get(id);
    if (state) {
      updateLendingState(id, state.currentBalance * ratio);
    }
  }
  log.info(`Reconciled tracked lend: ratio=${ratio.toFixed(4)} (tracked $${trackedTotal.toFixed(2)} → actual $${actualTotal.toFixed(2)})`);
}

async function getIdleUsdc(vaultId: number): Promise<number> {
  try {
    const [vaultPda] = deriveVaultPda(vaultId);
    const [assetVault] = deriveAssetVaultPda(vaultPda);
    return await getTokenBalance(assetVault);
  } catch {
    log.debug(`Could not read idle USDC for vault ${vaultId}, returning 0`);
    return 0;
  }
}

function updateLendingState(vaultId: string, balance: number): void {
  lendingState.set(vaultId, {
    vaultId,
    depositedUsdc: balance,
    currentBalance: balance,
    apy: 0.065,
    lastUpdated: new Date().toISOString(),
  });
}

export function getLendingState(vaultId: string): LendingPosition | undefined {
  return lendingState.get(vaultId);
}
