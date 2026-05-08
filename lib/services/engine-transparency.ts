export type EngineTransparencyResponse = {
  generatedAt: string;
  health: {
    lastScan: string | null;
    lastNavSync: string | null;
    lastPositionCheck: string | null;
    lastYieldRoute: string | null;
    rpcProvider?: "rpcfast" | "public";
    rpcFastStreamActive?: boolean;
  };
  vaults: Array<{
    id: number;
    strategyType: string;
    name: string;
    positions: number;
  }>;
  navs: Array<{
    vaultId: string;
    predictionPositionsValue: number;
    predictionValuationSource: "live" | "fallback";
    lendingBalance: number;
    lendingValuationSource: "state_cache" | "api";
    idleUsdc: number;
    totalNav: number;
    syncedNav: number;
    navDelta: number;
    dataQuality: "verified" | "degraded";
    degradedCauses: ("prediction_api_fallback" | "liquidity_sync_delta")[];
    pricePerShare: number;
    totalShares: number;
    timestamp: string;
  }>;
  trades: Array<{
    timestamp: string;
    vaultId: string;
    action: "open" | "close" | "harvest";
    marketId: string;
    side: "yes" | "no";
    amount: number;
    price: number;
    expectedPrice?: number | null;
    filledPrice?: number | null;
    slippageBps?: number | null;
    reasonCode?: string;
    status?: "submitted" | "confirmed" | "failed";
    txSignature: string | null;
  }>;
  decisions: Array<{
    timestamp: string;
    vaultId: string;
    marketId: string | null;
    title: string;
    action: string;
    reasonCode: string;
    expectedPrice?: number | null;
    currentPrice?: number | null;
    score?: number | null;
    confidence?: number | null;
    details?: string | null;
  }>;
};

export async function getEngineTransparency(): Promise<EngineTransparencyResponse> {
  const res = await fetch("/api/engine/transparency", {
    method: "GET",
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Transparency fetch failed (${res.status})`);
  }
  return (await res.json()) as EngineTransparencyResponse;
}

