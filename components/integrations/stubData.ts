import Decimal from "decimal.js";

import type {
  KiraDepositQuote,
  KiraDepositStatus,
  LPPosition,
  RebalancePlan,
  RebalanceState,
  TreasuryState,
} from "@/types/index";

export const STUB_TREASURY: TreasuryState = {
  vaultAddress: "Flowr111111111111111111111111111111111111111",
  usdcBalance: new Decimal("12450.32"),
  pendingPayoutUsdc: new Decimal("842.11"),
  activeSubscribers: 2,
  lastReconciledAt: new Date().toISOString(),
};

export const STUB_POSITIONS: LPPosition[] = [
  {
    id: "pos-kamino-1",
    protocol: "kamino",
    owner: "DemoOwner1111111111111111111111111111111111",
    poolOrMarketAddress: "PoolKamino1111111111111111111111111111111",
    tokenA: {
      mint: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      logoUri: "/file.svg",
    },
    tokenB: {
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    amountA: "12.5",
    amountB: "2400",
    range: {
      lower: new Decimal("142"),
      upper: new Decimal("168"),
    },
    metrics: {
      rangeProximityScore: new Decimal("72"),
      ilVelocityScore: new Decimal("65"),
      feeCaptureScore: new Decimal("81"),
      estimatedAprPercent: new Decimal("18.4"),
      tvlUsd: new Decimal("4200"),
    },
    status: "healthy",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pos-meteora-1",
    protocol: "meteora",
    owner: "DemoOwner1111111111111111111111111111111111",
    poolOrMarketAddress: "PoolMeteora1111111111111111111111111111111",
    tokenA: {
      mint: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
    },
    tokenB: {
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    amountA: "8.2",
    amountB: "5100",
    range: {
      lower: new Decimal("120"),
      upper: new Decimal("155"),
    },
    metrics: {
      rangeProximityScore: new Decimal("22"),
      ilVelocityScore: new Decimal("28"),
      feeCaptureScore: new Decimal("45"),
      estimatedAprPercent: new Decimal("24.2"),
      tvlUsd: new Decimal("8900"),
    },
    status: "critical",
    updatedAt: new Date().toISOString(),
  },
];

export const STUB_PRICES: Record<string, number> = {
  So11111111111111111111111111111111111111112: 155.42,
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 1,
};

export const STUB_SOL_PRICE = 155.42;

export const STUB_REBALANCE_PLAN: RebalancePlan = {
  id: "plan-stub-1",
  intentMode: "stable",
  createdAt: new Date().toISOString(),
  expectedFrsAfter: {
    total: new Decimal("78"),
    rangeProximity: new Decimal("80"),
    ilVelocity: new Decimal("74"),
    feeCapture: new Decimal("79"),
    computedAt: new Date().toISOString(),
  },
  steps: [
    {
      kind: "withdraw_liquidity",
      protocol: "meteora",
      positionId: "pos-meteora-1",
      liquidityAmount: "1000000",
    },
    {
      kind: "swap",
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amountIn: "1000000000",
    },
    {
      kind: "add_liquidity",
      protocol: "meteora",
      poolAddress: "PoolMeteora1111111111111111111111111111111",
      amountA: "8000000000",
      amountB: "5000000000",
      tickLower: -1234,
      tickUpper: 5678,
    },
  ],
};

export const STUB_REBALANCE_STATE_IDLE: RebalanceState = {
  planId: STUB_REBALANCE_PLAN.id,
  currentStepIndex: 0,
  txSignatures: [],
  status: "idle",
};

export const STUB_KIRA_QUOTE: KiraDepositQuote = {
  sourceChain: "ethereum",
  sourceAsset: "USDC",
  destinationMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amountIn: new Decimal("1000"),
  amountOutUsdc: new Decimal("997.25"),
  feeUsd: new Decimal("2.75"),
  etaSeconds: 420,
  quoteId: "kira-quote-stub",
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
};

export const STUB_KIRA_STATUS: KiraDepositStatus = {
  quoteId: "kira-quote-stub",
  status: "awaiting_funds",
  txHashes: {},
  updatedAt: new Date().toISOString(),
};
