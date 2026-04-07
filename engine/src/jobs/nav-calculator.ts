import { CONFIG } from "../config.js";

interface NavBreakdown {
  vaultId: string;
  predictionPositionsValue: number;
  lendingBalance: number;
  accruedYield: number;
  idleUsdc: number;
  totalNav: number;
  pricePerShare: number;
  totalShares: number;
  timestamp: string;
}

export class NavCalculator {
  private latestNav: Map<string, NavBreakdown> = new Map();

  async run(): Promise<void> {
    console.log("[nav-calculator] Computing NAV for all vaults...");

    for (const vaultId of Object.keys(CONFIG.VAULTS)) {
      try {
        const nav = await this.computeVaultNav(vaultId);
        this.latestNav.set(vaultId, nav);

        console.log(
          `[nav-calculator] Vault ${vaultId}: NAV = $${nav.totalNav.toFixed(2)}, PPS = $${nav.pricePerShare.toFixed(4)}`,
        );

        // In production: call on-chain update_nav instruction
        // await this.pushNavOnchain(vaultId, nav.totalNav);
      } catch (err) {
        console.error(`[nav-calculator] Error computing NAV for ${vaultId}:`, err);
      }
    }
  }

  private async computeVaultNav(vaultId: string): Promise<NavBreakdown> {
    // NAV = (prediction positions at market price)
    //      + (USDC in Jupiter Lend + accrued yield)
    //      + (idle USDC in treasury)

    const predictionPositionsValue = await this.getPredictionPositionsValue(vaultId);
    const lendingBalance = await this.getLendingBalance(vaultId);
    const accruedYield = await this.getAccruedYield(vaultId);
    const idleUsdc = await this.getIdleUsdc(vaultId);

    const totalNav =
      predictionPositionsValue + lendingBalance + accruedYield + idleUsdc;

    const totalShares = await this.getTotalShares(vaultId);
    const pricePerShare = totalShares > 0 ? totalNav / totalShares : 1.0;

    return {
      vaultId,
      predictionPositionsValue,
      lendingBalance,
      accruedYield,
      idleUsdc,
      totalNav,
      pricePerShare,
      totalShares,
      timestamp: new Date().toISOString(),
    };
  }

  private async getPredictionPositionsValue(
    _vaultId: string,
  ): Promise<number> {
    // In production: iterate over all active prediction positions,
    // fetch current market prices, compute: shares * currentPrice
    return 50_000;
  }

  private async getLendingBalance(_vaultId: string): Promise<number> {
    // In production: query Jupiter Lend for current deposit balance
    return 30_000;
  }

  private async getAccruedYield(_vaultId: string): Promise<number> {
    // In production: compute accrued lending yield
    return 450;
  }

  private async getIdleUsdc(_vaultId: string): Promise<number> {
    // In production: read treasury token account balance
    return 10_000;
  }

  private async getTotalShares(_vaultId: string): Promise<number> {
    // In production: read vault_token_mint supply from chain
    return 85_000;
  }

  getNav(vaultId: string): NavBreakdown | undefined {
    return this.latestNav.get(vaultId);
  }
}
