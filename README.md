# Axiom Vaults

**The first set-and-forget prediction market ETFs on Solana.**

> Reality is a new asset class. Set it. Forget it. Earn.

Axiom Vaults lets users deposit USDC into themed, auto-managed vaults that build diversified portfolios of prediction market positions. Idle capital earns yield via Jupiter Lend. Everything is on-chain, composable, and transparent.

## Vaults

| Vault                | Strategy                                                | Risk   | Target APY |
|----------------------|---------------------------------------------------------|--------|------------|
| **Safe Consensus**   | Buys >85% probability events                            | Low    | 8–15%      |
| **Macro Contrarian** | Targets mispriced 40–65% political/economic events      | High   | 20–50%     |
| **Yield Maximizer**  | 70% Jupiter Lend yield, 30% high-conviction predictions | Medium | 12–25%     |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 / React 19 / Tailwind v4)     │
│  Vault catalog · Deposit/Withdraw · Portfolio       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Strategy Engine (Node.js / TypeScript)             │
│  Market Scanner · Position Manager · Yield Router   │
│  NAV Calculator · AI Scoring · Limit Orders         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  On-Chain (Anchor / Rust / Solana Devnet)           │
│  Vault PDA · Token-2022 Shares · Deposit/Withdraw   │
│  sync_nav · Performance Fees · Pause/Unpause        │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Radix UI, Recharts, Framer Motion, Zustand
- **Wallet**: `@solana/wallet-adapter-react`
- **Solana**: `@solana/web3.js` 1.95.3, `@coral-xyz/anchor` 0.31.1, `@solana/spl-token` 0.4.13
- **Backend**: Node.js strategy engine with `node-cron`, Express health API
- **On-Chain**: Anchor (Rust), Token-2022 for vault shares
- **Infrastructure**: Powered by **RPC Fast** for low-latency Solana RPC
- **Data**: **Dune SIM** for real-time wallet balances and transaction history
- **APIs**: **Jupiter Developer Platform** (Prediction, Price, Tokens, Trigger, Lend)

## Jupiter Developer Platform Integration

All Jupiter APIs are routed through a single API key from [developers.jup.ag](https://developers.jup.ag):

| API                | Usage                                                                    |
|--------------------|--------------------------------------------------------------------------|
| **Prediction API** | Core product — scanning markets, placing orders, tracking positions      |
| **Price API v2**   | NAV calculation (USDC price validation), portfolio display               |
| **Tokens API**     | Token metadata enrichment in market scanner and positions table          |
| **Trigger API**    | Smart limit orders for prediction market entries (3% discount targeting) |
| **Lend/Earn**      | Idle USDC yield routing (6%+ APY on idle capital)                        |

See [DX-REPORT.md](./DX-REPORT.md) for our Jupiter Developer Experience report.

## Dune SIM Integration

| Endpoint                | Usage                                                             |
|-------------------------|-------------------------------------------------------------------|
| **Wallet Balances**     | Real USDC balance in deposit modal, live portfolio token holdings |
| **Transaction History** | Vault activity feed with real deposit/withdraw/trade data         |
| **Token Metadata**      | Enriching vault share token and prediction market token display   |

## RPC Fast Integration

All Solana RPC calls use **RPC Fast** infrastructure for sub-100ms latency:
- Frontend `ConnectionProvider`
- Engine Solana service
- Anchor provider in `Anchor.toml`

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-repo/spectra-vaults
cd spectra-vaults
npm install
cd engine && npm install && cd ..

# 2. Configure environment
cp .env.example .env.local
# Fill in: JUPITER_API_KEY, DUNE_SIM_API_KEY, RPC Fast URL

# 3. Run frontend
npm run dev

# 4. Run strategy engine (separate terminal)
cd engine && npm run dev
```

## Transparency Validation Runbook

Use this checklist whenever you want to verify that the transparency layer is healthy after code changes.

### 1) Start both services

```bash
# terminal 1
cd engine
npm run dev

# terminal 2 (repo root)
npm run dev
```

Expected engine log:
- `Health endpoint listening on http://localhost:3001/health`

### 2) Open transparency UI

- Frontend page: `http://localhost:3000/transparency`
- Engine aggregate API: `http://localhost:3001/api/transparency`
- Frontend proxy API: `http://localhost:3000/api/engine/transparency`

All API URLs above should return JSON.

### 3) What to check in the dashboard

- **NAV Reconciliation**
  - `Computed NAV`, `Synced NAV`, `Delta`, and `Status` are populated.
  - `Degraded causes` is populated when status is `degraded`.
- **Recent Decisions**
  - Contains entries for opens/skips/exits/harvests with `reasonCode`.
- **Execution Quality**
  - Shows `expectedPrice`, `filledPrice`, `slippageBps`, and `reasonCode`.
  - Solscan link is present when `txSignature` exists.
- **Filters**
  - Vault/action/time-window filters correctly reduce rows.

### 4) Degraded causes interpretation

- `prediction_api_fallback`
  - Engine could not fetch live prediction position pricing and used local fallback values.
- `liquidity_sync_delta`
  - Synced on-chain NAV is intentionally limited to redeemable idle USDC, so computed and synced NAV diverge.

### 5) Common troubleshooting

- Empty transparency UI:
  - Ensure engine is running on `:3001`.
  - Wait for at least one scan/NAV cycle.
- Proxy errors from frontend:
  - Set in `.env.local` and restart frontend:
    - `ENGINE_API_BASE_URL=http://localhost:3001`
    - or `NEXT_PUBLIC_ENGINE_API_BASE_URL=http://localhost:3001`
- No trade/decision rows:
  - Trigger activity (deposit/withdraw/engine cycle), then refresh `/transparency`.

## Project Structure

```
Spectra/
├── app/                    # Next.js pages (vaults, portfolio)
├── components/             # React components (vault cards, modals, charts)
├── lib/
│   ├── spectra/            # Anchor client, hooks, vault PDAs
│   └── services/           # Jupiter + Dune SIM frontend services
├── engine/
│   ├── src/
│   │   ├── services/       # Jupiter (Prediction, Price, Tokens, Trigger, Lend), Solana, Vault
│   │   ├── strategies/     # Safe Consensus, Macro Contrarian, Yield Maximizer
│   │   ├── jobs/           # Market Scanner, Position Manager, Yield Router, NAV Calculator
│   │   └── utils/          # Logger, retry with exponential backoff
│   └── package.json
├── programs/
│   └── spectra-vault/      # Anchor/Rust on-chain program
├── constants/              # Shared constants, vault configs
├── config/                 # Environment helpers
├── DX-REPORT.md            # Jupiter Developer Experience report
└── Anchor.toml
```
