import axios from "axios";
import { CONFIG } from "../config.js";

interface VaultPosition {
  vaultId: string;
  marketId: string;
  side: "yes" | "no";
  shares: number;
  avgEntryPrice: number;
  currentPrice: number;
  pnl: number;
}

export class PositionManager {
  private positions: Map<string, VaultPosition[]> = new Map();

  async run(): Promise<void> {
    console.log("[position-manager] Checking positions...");

    for (const [vaultId, vaultConfig] of Object.entries(CONFIG.VAULTS)) {
      const vaultPositions = this.positions.get(vaultId) ?? [];

      // Check for resolved markets — harvest profits
      for (const pos of vaultPositions) {
        const resolved = await this.checkIfResolved(pos.marketId);
        if (resolved) {
          console.log(
            `[position-manager] Market ${pos.marketId} resolved. Harvesting for vault ${vaultId}`,
          );
          await this.harvestPosition(vaultId, pos);
        }
      }

      // Check position sizing vs allocation limits
      const totalExposure = vaultPositions.reduce(
        (sum, p) => sum + p.shares * p.currentPrice,
        0,
      );
      console.log(
        `[position-manager] Vault ${vaultId}: ${vaultPositions.length} positions, $${totalExposure.toFixed(2)} exposure`,
      );
    }
  }

  private async checkIfResolved(marketId: string): Promise<boolean> {
    try {
      const { data } = await axios.get(
        `${CONFIG.JUPITER_PREDICTION_API}/markets/${marketId}`,
        { timeout: 5_000 },
      );
      return data.status === "resolved";
    } catch {
      return false;
    }
  }

  private async harvestPosition(
    vaultId: string,
    position: VaultPosition,
  ): Promise<void> {
    // In production: redeem resolved prediction tokens, convert to USDC
    console.log(
      `[position-manager] Harvesting ${position.shares} shares from market ${position.marketId} for vault ${vaultId}`,
    );

    const vaultPositions = this.positions.get(vaultId) ?? [];
    this.positions.set(
      vaultId,
      vaultPositions.filter((p) => p.marketId !== position.marketId),
    );
  }

  async openPosition(
    vaultId: string,
    marketId: string,
    side: "yes" | "no",
    usdcAmount: number,
  ): Promise<void> {
    console.log(
      `[position-manager] Opening ${side} position on ${marketId} for vault ${vaultId}: $${usdcAmount}`,
    );

    // In production: POST to Jupiter Prediction API to create order
    try {
      await axios.post(
        `${CONFIG.JUPITER_PREDICTION_API}/orders`,
        {
          marketId,
          side,
          amount: usdcAmount,
          type: "market",
        },
        { timeout: 10_000 },
      );
    } catch (err) {
      console.error(`[position-manager] Failed to open position:`, err);
    }
  }

  getPositions(vaultId: string): VaultPosition[] {
    return this.positions.get(vaultId) ?? [];
  }
}
