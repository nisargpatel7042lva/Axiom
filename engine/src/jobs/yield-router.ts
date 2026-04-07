import { CONFIG } from "../config.js";

interface LendingPosition {
  vaultId: string;
  depositedUsdc: number;
  accruedYield: number;
  apy: number;
}

export class YieldRouter {
  private lendingPositions: Map<string, LendingPosition> = new Map();

  async run(): Promise<void> {
    console.log("[yield-router] Routing idle USDC to Jupiter Lend...");

    for (const [vaultId, vaultConfig] of Object.entries(CONFIG.VAULTS)) {
      const lendingTarget = vaultConfig.lendingAllocation;

      // Check current vault USDC balance (idle funds)
      const idleUsdc = await this.getIdleUsdc(vaultId);

      // Calculate how much should go to lending
      const vaultNav = await this.getVaultNav(vaultId);
      const targetLendingAmount = vaultNav * lendingTarget;
      const currentLending = this.lendingPositions.get(vaultId)?.depositedUsdc ?? 0;
      const deficit = targetLendingAmount - currentLending;

      if (deficit > 100 && idleUsdc > 100) {
        const toDeposit = Math.min(deficit, idleUsdc);
        console.log(
          `[yield-router] Depositing $${toDeposit.toFixed(2)} to Jupiter Lend for vault ${vaultId}`,
        );
        await this.depositToLend(vaultId, toDeposit);
      } else if (deficit < -100) {
        const toWithdraw = Math.abs(deficit);
        console.log(
          `[yield-router] Withdrawing $${toWithdraw.toFixed(2)} from Jupiter Lend for vault ${vaultId}`,
        );
        await this.withdrawFromLend(vaultId, toWithdraw);
      }
    }
  }

  private async getIdleUsdc(_vaultId: string): Promise<number> {
    // In production: read from on-chain treasury token account
    return 10_000;
  }

  private async getVaultNav(_vaultId: string): Promise<number> {
    // In production: read from on-chain vault state
    return 100_000;
  }

  private async depositToLend(
    vaultId: string,
    amount: number,
  ): Promise<void> {
    // In production: use @jup-ag/lend SDK
    // const { getDepositIxs } = await import("@jup-ag/lend/earn");
    // const ixs = await getDepositIxs({ amount, mint: USDC_MINT });
    // ... build and send transaction

    const current = this.lendingPositions.get(vaultId) ?? {
      vaultId,
      depositedUsdc: 0,
      accruedYield: 0,
      apy: 0.065,
    };
    current.depositedUsdc += amount;
    this.lendingPositions.set(vaultId, current);
    console.log(
      `[yield-router] Deposited $${amount.toFixed(2)} for vault ${vaultId}. Total lending: $${current.depositedUsdc.toFixed(2)}`,
    );
  }

  private async withdrawFromLend(
    vaultId: string,
    amount: number,
  ): Promise<void> {
    // In production: use @jup-ag/lend SDK
    const current = this.lendingPositions.get(vaultId);
    if (!current) return;
    current.depositedUsdc = Math.max(0, current.depositedUsdc - amount);
    this.lendingPositions.set(vaultId, current);
    console.log(
      `[yield-router] Withdrew $${amount.toFixed(2)} for vault ${vaultId}. Remaining lending: $${current.depositedUsdc.toFixed(2)}`,
    );
  }

  getLendingPosition(vaultId: string): LendingPosition | undefined {
    return this.lendingPositions.get(vaultId);
  }
}
