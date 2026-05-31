import { getAllVaultConfigs } from "../config.js";
import { fetchVaultState } from "../services/vault-contract.js";
import { collectPerformanceFee } from "../services/vault-admin.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("fee-collector");

// PPS_PRECISION matches the on-chain constant (10^9).
const PPS_PRECISION = 1_000_000_000n;

/**
 * For each vault, check if the current price-per-share exceeds the on-chain
 * high-water mark. If so, call collect_performance_fee to mint fee shares to
 * the authority. The program enforces the PPS > HWM invariant — this job is
 * just the trigger.
 *
 * Run frequency: daily is sufficient since fee collection is not time-sensitive.
 * Running more often wastes SOL on transaction fees without material benefit.
 */
export async function runFeeCollector(): Promise<void> {
  log.info("Fee collection check starting...");

  for (const vaultConfig of getAllVaultConfigs()) {
    try {
      const state = await fetchVaultState(vaultConfig.id);
      if (!state) {
        log.debug(`[${vaultConfig.name}] Vault not on-chain yet — skipping`);
        continue;
      }

      const { totalAssets, totalShares, highWaterMarkRaw } = state;

      if (totalShares <= 0) {
        log.debug(`[${vaultConfig.name}] No shares outstanding — skipping`);
        continue;
      }

      // Compute current PPS in the same 9-decimal fixed-point the program uses.
      const totalAssetsRaw = BigInt(Math.floor(totalAssets * 1e6));
      const totalSharesRaw = BigInt(Math.floor(totalShares * 1e9));
      const currentPps = (totalAssetsRaw * PPS_PRECISION) / totalSharesRaw;

      log.info(
        `[${vaultConfig.name}] PPS=${(Number(currentPps) / 1e9).toFixed(6)} ` +
          `HWM=${(Number(highWaterMarkRaw) / 1e9).toFixed(6)}`,
      );

      if (currentPps > highWaterMarkRaw) {
        log.info(`[${vaultConfig.name}] PPS above HWM — collecting performance fee`);
        await collectPerformanceFee(vaultConfig.id);
      } else {
        log.info(`[${vaultConfig.name}] PPS at or below HWM — no fee to collect`);
      }
    } catch (err) {
      log.error(`[${vaultConfig.name}] Fee collection check failed`, err);
    }
  }

  log.info("Fee collection check complete");
}
