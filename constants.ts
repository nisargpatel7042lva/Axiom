import { IDL } from "@/lib/spectra/idl";
import type { VaultConfig, VaultId } from "@/types";

export const SPECTRA_PROGRAM_ADDRESS = IDL.address as string;

/** Hero / aurora palette: teal, indigo, violet, sky (matches marketing UI). */
export const SITE_PRIMARY_GRADIENT_COLORS = [
  "#00e5c3",
  "#6366f1",
  "#a855f7",
  "#0ea5e9",
] as const;

/** Three-stop gradient for vault detail PrismaticBurst (matches each vault’s theme). */
export const VAULT_PRISMATIC_BURST_COLORS: Record<VaultId, string[]> = {
  "safe-consensus": ["#38bdf8", "#0284c7", "#e0f2fe"],
  "macro-contrarian": ["#c4b5fd", "#7c3aed", "#ede9fe"],
  "yield-maximizer": ["#fb923c", "#ea580c", "#ffedd5"],
};

export function getVaultPrismaticBurstColors(id: VaultId): string[] {
  return VAULT_PRISMATIC_BURST_COLORS[id];
}

/** BorderGlow mesh + HSL shadow per vault (listing cards, home teasers). */
export type VaultBorderGlowSpec = {
  colors: [string, string, string];
  glowHsl: string;
};

export const VAULT_BORDER_GLOW: Record<VaultId, VaultBorderGlowSpec> = {
  "safe-consensus": {
    colors: ["#00e5c3", "#34d399", "#a7f3d0"],
    glowHsl: "162 78 52",
  },
  "macro-contrarian": {
    colors: ["#c084fc", "#8b5cf6", "#ddd6fe"],
    glowHsl: "258 88 65",
  },
  "yield-maximizer": {
    colors: ["#fbbf24", "#f59e0b", "#fed7aa"],
    glowHsl: "32 92 56",
  },
};

const riskDim = (
  id: string,
  label: string,
  stress: "low" | "moderate" | "elevated",
  rationale: string,
) => ({ id, label, stress, rationale });

export const VAULT_CONFIGS: VaultConfig[] = [
  {
    id: "safe-consensus",
    chainVaultId: 1,
    name: "Safe Consensus",
    ticker: "AX-SAFE",
    description:
      "Targets high-conviction, higher-probability outcomes with a capital-preservation tilt.",
    strategy: "Consensus-weighted prediction exposure with tight probability bands.",
    riskLevel: "low",
    targetApy: { min: 4, max: 10 },
    icon: "shield",
    accentColor: "#00e5c3",
    allocation: { predictions: 70, lending: 20, idle: 10 },
    minDeposit: 10,
    performanceFeeBps: 100,
    targetCapacityUsd: 2_500_000,
    exposureVenues: [
      { label: "Prediction venues", role: "Primary NAV driver (resolved positions)" },
      { label: "Jupiter Lend", role: "Idle USDC yield" },
    ],
    riskSheet: {
      grade: "A",
      headline:
        "Designed for smoother NAV paths by emphasizing higher-probability markets and diversified venues.",
      dimensions: [
        riskDim("conviction", "Conviction / tail risk", "low", "Band-focused sizing reduces single-outcome shock."),
        riskDim("liquidity", "Liquidity & settlement", "moderate", "Resolutions and venue depth can still gap around events."),
        riskDim("model", "Model / data risk", "moderate", "Probabilities and feeds can be stale vs fast-moving news."),
      ],
    },
  },
  {
    id: "macro-contrarian",
    chainVaultId: 2,
    name: "Macro Contrarian",
    ticker: "AX-MACRO",
    description:
      "Seeks dislocations in mid-band probabilities where the crowd may be mispriced.",
    strategy: "Contrarian tilts across macro-linked and political markets with defined risk.",
    riskLevel: "medium",
    targetApy: { min: 8, max: 22 },
    icon: "target",
    accentColor: "#8b5cf6",
    allocation: { predictions: 75, lending: 20, idle: 5 },
    minDeposit: 25,
    performanceFeeBps: 150,
    targetCapacityUsd: 1_500_000,
    exposureVenues: [
      { label: "Prediction venues", role: "Contrarian positioning" },
      { label: "Jupiter Lend", role: "Partial idle yield" },
    ],
    riskSheet: {
      grade: "B",
      headline:
        "Higher payoff potential comes with more path volatility around catalysts and narrative shifts.",
      dimensions: [
        riskDim("conviction", "Conviction / tail risk", "elevated", "Mid-band markets can gap sharply on new information."),
        riskDim("liquidity", "Liquidity & settlement", "moderate", "Wider spreads possible outside headline events."),
        riskDim("model", "Model / data risk", "moderate", "Contrarian signals can be early — timing risk is real."),
      ],
    },
  },
  {
    id: "yield-maximizer",
    chainVaultId: 3,
    name: "Yield Maximizer",
    ticker: "AX-YIELD",
    description:
      "Prioritizes lending yield while keeping a smaller sleeve of high-confidence predictions.",
    strategy: "Jupiter Lend-heavy with selective high-probability prediction exposure.",
    riskLevel: "high",
    targetApy: { min: 10, max: 28 },
    icon: "gem",
    accentColor: "#f59e0b",
    allocation: { predictions: 35, lending: 55, idle: 10 },
    minDeposit: 25,
    performanceFeeBps: 150,
    targetCapacityUsd: 1_000_000,
    exposureVenues: [
      { label: "Jupiter Lend", role: "Primary yield engine" },
      { label: "Prediction venues", role: "Smaller tactical sleeve" },
    ],
    riskSheet: {
      grade: "C",
      headline:
        "Lending and venue counterparty factors dominate — treat as more rate- and protocol-sensitive.",
      dimensions: [
        riskDim("conviction", "Conviction / tail risk", "moderate", "Smaller prediction sleeve still has event risk."),
        riskDim("liquidity", "Liquidity & settlement", "low", "Lending pools are generally continuous, with normal DeFi constraints."),
        riskDim("counterparty", "Venue / smart-contract risk", "elevated", "Yield routes through external protocols and markets."),
      ],
    },
  },
];

export function getVaultConfig(id: string): VaultConfig | undefined {
  return VAULT_CONFIGS.find((c) => c.id === (id as VaultId));
}
