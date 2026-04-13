import type { VaultConfig } from "@/types";

export const SPL_TOKEN_PROGRAM_ID =
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as const;

export const TOKEN_2022_PROGRAM_ID =
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" as const;

export const ASSOCIATED_TOKEN_PROGRAM_ID =
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as const;

export const USDC_MINT_DEVNET =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" as const;

export const USDC_MINT_MAINNET =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as const;

export const USDC_DECIMALS = 6;

export const API_ENDPOINTS = {
  JUPITER_PREDICTION: "https://api.jup.ag/prediction/v1",
  JUPITER_LEND: "https://api.jup.ag/lend/v1",
  JUPITER_PRICE: "https://api.jup.ag/price/v2",
  JUPITER_TOKENS: "https://api.jup.ag/tokens/v1",
  JUPITER_TRIGGER: "https://api.jup.ag/trigger/v1",
  DUNE_SIM: "https://api.sim.dune.com",
  ENGINE_HEALTH: "http://localhost:3001/health",
} as const;

export const PERFORMANCE_FEE_BPS = 1000; // 10% above high-water mark

/** Matches `declare_id!` in `programs/spectra-vault` (Solscan / env overrides use the same string). */
export const SPECTRA_PROGRAM_ADDRESS =
  "JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH" as const;

export const VAULT_CONFIGS: VaultConfig[] = [
  {
    id: "safe-consensus",
    chainVaultId: 1,
    name: "Safe Consensus",
    ticker: "spSAFE",
    description:
      "Low-risk vault buying high-probability prediction markets (>85%). Ideal for conservative depositors seeking steady, predictable returns.",
    strategy:
      "Buys YES positions on events with >85% consensus probability. Auto-harvests resolved markets and reinvests.",
    riskLevel: "low",
    targetApy: { min: 8, max: 15 },
    icon: "🛡️",
    accentColor: "#00e5c3",
    allocation: { predictions: 60, lending: 30, idle: 10 },
    minDeposit: 10,
    performanceFeeBps: 1000,
    targetCapacityUsd: 7_000_000,
    exposureVenues: [
      { label: "Jupiter Prediction", role: "Primary deployment" },
      { label: "Jupiter Lend", role: "Idle USDC yield" },
      { label: "Circle USDC", role: "Vault asset" },
    ],
    riskSheet: {
      grade: "A",
      headline: "Tight consensus band; diversified idle yield; clearest loss drivers.",
      dimensions: [
        {
          id: "liquidity",
          label: "Liquidity & exit",
          stress: "low",
          rationale: "Targets liquid, high-consensus markets; share redemption follows on-chain NAV math.",
        },
        {
          id: "model",
          label: "Resolution & oracle",
          stress: "moderate",
          rationale: "Outcomes depend on market rules and oracle resolution — disclosed upfront.",
        },
        {
          id: "counterparty",
          label: "Venue & asset stack",
          stress: "moderate",
          rationale: "Exposure to Jupiter surfaces and USDC issuer risk, typical of Solana DeFi yield.",
        },
        {
          id: "operational",
          label: "Engine & upgrades",
          stress: "moderate",
          rationale: "Off-chain engine proposes actions; program enforces vault rules you can verify on-chain.",
        },
      ],
    },
  },
  {
    id: "macro-contrarian",
    chainVaultId: 2,
    name: "Macro Contrarian",
    ticker: "spMACRO",
    description:
      "Higher-risk vault targeting mispriced events in politics, economics, and geopolitics. For sophisticated depositors comfortable with volatility.",
    strategy:
      "Identifies mispriced 40-65% probability events using signal analysis. Takes contrarian positions with conviction-weighted sizing.",
    riskLevel: "high",
    targetApy: { min: 20, max: 50 },
    icon: "🎯",
    accentColor: "#f59e0b",
    allocation: { predictions: 80, lending: 10, idle: 10 },
    minDeposit: 50,
    performanceFeeBps: 1000,
    targetCapacityUsd: 500_000,
    exposureVenues: [
      { label: "Jupiter Prediction", role: "Macro / political book" },
      { label: "Jupiter Lend", role: "Small idle sleeve" },
      { label: "Circle USDC", role: "Vault asset" },
    ],
    riskSheet: {
      grade: "C",
      headline: "Contrarian macro book — higher variance and headline risk than consensus strategies.",
      dimensions: [
        {
          id: "liquidity",
          label: "Liquidity & exit",
          stress: "elevated",
          rationale: "Thinner two-sided flow on niche events can widen effective exit costs.",
        },
        {
          id: "model",
          label: "Resolution & oracle",
          stress: "elevated",
          rationale: "Disputed or delayed resolutions have outsized impact on P&L vs high-consensus books.",
        },
        {
          id: "counterparty",
          label: "Venue & asset stack",
          stress: "moderate",
          rationale: "Same venue stack as other vaults; sizing is the differentiator.",
        },
        {
          id: "operational",
          label: "Engine & upgrades",
          stress: "moderate",
          rationale: "Signal-driven sizing increases reliance on monitoring and circuit breakers (e.g. pause).",
        },
      ],
    },
  },
  {
    id: "yield-maximizer",
    chainVaultId: 3,
    name: "Yield Maximizer",
    ticker: "spYIELD",
    description:
      "Balanced vault splitting between Jupiter Lend yield and high-conviction predictions (>75%). Best of both worlds.",
    strategy:
      "70% deployed to Jupiter Lend for base yield, 30% allocated to >75% conviction prediction markets for alpha.",
    riskLevel: "medium",
    targetApy: { min: 12, max: 25 },
    icon: "💎",
    accentColor: "#8b5cf6",
    allocation: { predictions: 30, lending: 70, idle: 0 },
    minDeposit: 25,
    performanceFeeBps: 1000,
    targetCapacityUsd: 2_000_000,
    exposureVenues: [
      { label: "Jupiter Lend", role: "Majority TVL" },
      { label: "Jupiter Prediction", role: "Conviction sleeve" },
      { label: "Circle USDC", role: "Vault asset" },
    ],
    riskSheet: {
      grade: "B",
      headline: "Lend-heavy base with a smaller prediction sleeve — balanced but two distinct risk engines.",
      dimensions: [
        {
          id: "liquidity",
          label: "Liquidity & exit",
          stress: "moderate",
          rationale: "Lend markets are generally deep; prediction sleeve adds event-specific liquidity risk.",
        },
        {
          id: "model",
          label: "Resolution & oracle",
          stress: "moderate",
          rationale: "Prediction leg inherits resolution risk; lend leg depends on pool utilization and rates.",
        },
        {
          id: "counterparty",
          label: "Venue & asset stack",
          stress: "moderate",
          rationale: "Concentrated in Jupiter + USDC stack — fewer venues, larger per-venue notional.",
        },
        {
          id: "operational",
          label: "Engine & upgrades",
          stress: "moderate",
          rationale: "Rebalancing across two venues increases path complexity vs single-strategy vaults.",
        },
      ],
    },
  },
];

export function getVaultConfig(id: string): VaultConfig | undefined {
  return VAULT_CONFIGS.find((v) => v.id === id);
}
