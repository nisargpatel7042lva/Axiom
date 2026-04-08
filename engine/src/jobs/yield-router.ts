import { jupiterLend } from "../services/jupiter-lend.js";
import { getTokenBalance } from "../services/solana.js";
import { getAllVaultConfigs, CONFIG } from "../config.js";
import { deriveVaultPda } from "../services/vault-contract.js";
import { createLogger } from "../utils/logger.js";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { LendingPosition } from "../types/index.js";

const log = createLogger("yield-router");

const lendingState = new Map<string, LendingPosition>();

export async function runYieldRouter(): Promise<void> {
  log.info("Routing idle USDC to Jupiter Lend...");

  for (const vaultConfig of getAllVaultConfigs()) {
    const vaultId = vaultConfig.strategyType;

    try {
      const idleUsdc = await getIdleUsdc(vaultConfig.id);
      const lendBalance = await jupiterLend.getEarnBalance();
      const estimatedNav = idleUsdc + lendBalance;

      const targetLend = estimatedNav * vaultConfig.lendAllocationPct;
      const currentLend = lendBalance;
      const deficit = targetLend - currentLend;

      const minBuffer = estimatedNav * CONFIG.IDLE_BUFFER_PCT;

      if (deficit > 100 && idleUsdc - deficit > minBuffer) {
        const toDeposit = Math.min(deficit, idleUsdc - minBuffer);
        if (toDeposit > 50) {
          log.info(`[${vaultConfig.name}] Depositing $${toDeposit.toFixed(2)} to Jupiter Lend`);
          await jupiterLend.depositToEarn(toDeposit);
          updateLendingState(vaultId, currentLend + toDeposit);
        }
      } else if (deficit < -100) {
        const toWithdraw = Math.min(Math.abs(deficit), currentLend);
        if (toWithdraw > 50) {
          log.info(`[${vaultConfig.name}] Withdrawing $${toWithdraw.toFixed(2)} from Jupiter Lend`);
          await jupiterLend.withdrawFromEarn(toWithdraw);
          updateLendingState(vaultId, currentLend - toWithdraw);
        }
      } else {
        log.info(
          `[${vaultConfig.name}] Lending allocation on target (current: $${currentLend.toFixed(2)}, target: $${targetLend.toFixed(2)})`,
        );
      }
    } catch (err) {
      log.error(`[${vaultConfig.name}] Yield routing error`, err);
    }
  }

  log.info("Yield routing complete");
}

async function getIdleUsdc(vaultId: number): Promise<number> {
  try {
    const [vaultPda] = deriveVaultPda(vaultId);
    const usdcMint = new PublicKey(CONFIG.USDC_MINT);
    const ata = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);
    return await getTokenBalance(ata);
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
