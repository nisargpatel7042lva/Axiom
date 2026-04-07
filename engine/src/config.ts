export const CONFIG = {
  RPC_URL: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  JUPITER_PREDICTION_API: "https://api.jup.ag/prediction/v1",
  JUPITER_LEND_API: "https://api.jup.ag/lend/v1",
  WALLET_KEYPAIR_PATH: process.env.WALLET_KEYPAIR_PATH || "~/.config/solana/id.json",
  VAULT_PROGRAM_ID: "SpVau1tXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  USDC_MINT: process.env.USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",

  VAULTS: {
    "safe-consensus": {
      minProbability: 0.85,
      maxProbability: 1.0,
      predictionAllocation: 0.6,
      lendingAllocation: 0.3,
      maxPositionSizePct: 0.1,
    },
    "macro-contrarian": {
      minProbability: 0.4,
      maxProbability: 0.65,
      predictionAllocation: 0.8,
      lendingAllocation: 0.1,
      maxPositionSizePct: 0.15,
    },
    "yield-maximizer": {
      minProbability: 0.75,
      maxProbability: 1.0,
      predictionAllocation: 0.3,
      lendingAllocation: 0.7,
      maxPositionSizePct: 0.08,
    },
  },
} as const;
