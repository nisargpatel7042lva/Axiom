<div align="center">

<img src="public/axiom-logo.png" alt="Axiom Vaults" width="80" />

# Axiom Vaults

### Reality is a new asset class. Set it. Forget it. Earn.

Axiom Vaults is an autonomous, non-custodial prediction market ETF protocol on Solana.  
Deposit USDC into a strategy vault. An AI-powered engine finds, enters, and exits prediction market positions — then routes idle capital to lending — all on-chain, all transparent.

[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![Powered by Jupiter](https://img.shields.io/badge/Powered%20by-Jupiter-18B2A0?style=flat-square)](https://jup.ag)
[![Data by Dune SIM](https://img.shields.io/badge/Data%20by-Dune%20SIM-FF7B00?style=flat-square)](https://sim.dune.com)
[![RPC Fast](https://img.shields.io/badge/RPC-RPC%20Fast-00E5C3?style=flat-square)](https://rpcfast.com)
[![Colosseum Hackathon 2026](https://img.shields.io/badge/Colosseum-Hackathon%202026-FFD700?style=flat-square)](https://colosseum.org)

</div>

---

## What We Built

Most DeFi users miss prediction markets entirely — scanning live events, sizing positions, and timing exits is a full-time job. Axiom Vaults turns that work into a product anyone can use.

**You deposit USDC. A vault does everything else.**

- The on-chain **Spectra program** (Anchor/Rust, Token-2022) mints you share tokens representing your proportional claim on the vault.
- An autonomous **strategy engine** (Node.js) scans prediction markets via Jupiter every 30 minutes, scores them with Claude AI, executes positions through Jupiter Trigger limit orders, and harvests winnings automatically.
- Idle capital between positions is routed into **Jupiter Lend** (~6.5% APY) so nothing sits uninvested.
- When you redeem shares, the vault calculates your USDC entitlement and transfers it back. No lock-ups. No manual steps. No management fee.
- Every decision the engine makes — opens, skips, exits, harvests — is logged and surfaced on a public **Transparency Dashboard**.

---

## The Three Vaults

| Vault | Ticker | Risk | Target APY | Capital Allocation |
|-------|--------|------|-----------|-------------------|
| **Safe Consensus** | `AX-SAFE` | Low · Grade A | 4–10% | 70% predictions · 20% Jupiter Lend · 10% idle |
| **Macro Contrarian** | `AX-MACRO` | Medium · Grade B | 8–22% | 75% predictions · 20% Jupiter Lend · 5% idle |
| **Yield Maximizer** | `AX-YIELD` | High · Grade C | 10–28% | 35% predictions · 55% Jupiter Lend · 10% idle |

**Safe Consensus** — Targets only high-probability markets (>85% confidence). Exits if confidence drops below 75% or position loss exceeds 15%. Capital-preservation first.

**Macro Contrarian** — Targets mid-band markets (40–65%) where crowd mispricing is most common. Contrarian tilts on macro, political, and economic events. Higher volatility, higher ceiling.

**Yield Maximizer** — Lend-heavy vault. Jupiter Lend forms the yield floor (55% allocation) while a selective prediction sleeve adds upside. Best for users who want yield-like behavior with occasional prediction alpha.

All vaults: **0% management fee** · Performance fee (100–150 bps) only above the high-water mark · Non-custodial · Anchor program on Solana devnet.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AXIOM FRONTEND                               │
│             Next.js 16 · React 19 · TanStack Query v5               │
│                                                                       │
│  ┌──────────────┐  ┌───────────────────┐  ┌───────────────────────┐ │
│  │  Vault Pages │  │   Portfolio Page  │  │  Transparency Page    │ │
│  │  Deposit /   │  │  Token Holdings   │  │  NAV reconciliation   │ │
│  │  Withdraw    │  │  P&L Chart        │  │  Decisions · Trades   │ │
│  │  PPS Chart   │  │  Activity Feed    │  │  Dune SIM event log   │ │
│  └──────────────┘  └───────────────────┘  └───────────────────────┘ │
│                                                                       │
│  ── Data Layer ────────────────────────────────────────────────────  │
│  Dune SIM /beta/svm/balances  ·  Dune SIM /beta/svm/transactions    │
│  RPC Fast (on-chain state)    ·  Jupiter Price API                  │
│  Engine transparency API      ·  Dune SIM webhook receiver          │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ Solana wallet adapter
┌──────────────────────────────────▼──────────────────────────────────┐
│                     SPECTRA PROGRAM (Anchor / Rust)                   │
│         Program ID: JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH   │
│                                                                       │
│  deposit()  withdraw()  sync_nav()  collect_performance_fee()        │
│  bootstrap_vault()  initialize_strategy_config()  pause()            │
│                                                                       │
│  PDAs: vault · shares_mint (Token-2022) · asset_vault · strategy    │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ authority keypair
┌──────────────────────────────────▼──────────────────────────────────┐
│                    STRATEGY ENGINE (Node.js / TypeScript)             │
│                                                                       │
│  Every 30 min ──▶  Market Scanner → AI Scoring → NAV Calculator     │
│  Every 15 min ──▶  Position Manager (harvest wins, place orders)     │
│  Every  1 hour ──▶  Yield Router (rebalance Jupiter Lend vs idle)    │
│                                                                       │
│  ┌────────────────────────────┐  ┌────────────────────────────────┐ │
│  │     Jupiter APIs           │  │  Claude 3.5 Haiku (AI Scoring) │ │
│  │  Prediction · Trigger      │  │  Evaluates each market against │ │
│  │  Lend/Earn · Price · Tokens│  │  vault strategy rules before   │ │
│  └────────────────────────────┘  │  execution                     │ │
│                                  └────────────────────────────────┘ │
│  ┌────────────────────────────┐                                      │
│  │  RPC Fast Yellowstone gRPC │  Real-time vault PDA monitoring.    │
│  │  (when configured)         │  Triggers immediate NAV recalc on   │
│  │                            │  account change — no cron wait.     │
│  └────────────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Sponsor Integrations

### Jupiter Developer Platform

> Single API key from `developers.jup.ag` — five Jupiter primitives powering the entire vault loop.

**Jupiter is not a bolt-on here. It is the product.** Every scan, every trade, every yield harvest, every NAV calculation runs through Jupiter.

| API | What We Do With It |
|-----|--------------------|
| **Prediction API** `api.jup.ag/prediction/v1` | Core market intelligence. The engine scans live/trending events every 30 minutes, reads market probabilities, tracks open positions across all three vaults, and harvests resolved winning positions. |
| **Trigger API** `api.jup.ag/trigger/v1` | Smart limit orders for every prediction market entry. We target a 3% discount on the current probability — meaning we only enter if the market moves in our direction. Better fills, less slippage. |
| **Lend / Earn SDK** `@jup-ag/lend` | Idle USDC between prediction positions doesn't sit. The Yield Router deposits it into Jupiter Lend on an hourly cron and rebalances to maintain each vault's target allocation (20–55%). On mainnet this earns ~6.5% APY. |
| **Price API v3** `api.jup.ag/price/v3` | Per-mint USD prices used in NAV validation and portfolio value display. |
| **Tokens API** `api.jup.ag/tokens/v2` | Token metadata enrichment for prediction market assets in the scanner and positions table. |

**Engine flow (every 30 minutes):**
```
Jupiter Prediction API
  └─▶ scan live + trending markets
      └─▶ apply strategy filters (probability bands, category rules)
          └─▶ Claude AI scores remaining candidates
              └─▶ Jupiter Trigger API places limit orders for top picks
                  └─▶ Jupiter Lend SDK rebalances idle capital hourly
                      └─▶ NAV summed (positions + lending balance + idle USDC)
                          └─▶ sync_nav() writes computed NAV to chain
```

Key files: `engine/src/jobs/market-scanner.ts` · `engine/src/jobs/position-manager.ts` · `engine/src/jobs/nav-calculator.ts` · `engine/src/jobs/yield-router.ts` · `engine/src/services/jupiter-lend.ts`

---

### Dune SIM

> Real-time SVM data through two endpoints — no indexer, no custom subgraph, no stale cache.

We use Dune SIM at three distinct points in the user journey, all driven by two SIM endpoints:

#### Endpoint 1: `/beta/svm/balances/{address}`

**Token Holdings Table** (Portfolio page) — The full SPL token balance response from SIM (`symbol`, `name`, `logo_url`, `price_usd`, `value_usd`, `amount`, `decimals`) populates a live token holdings table. One SIM call replaces what would otherwise require multiple RPC calls plus a token metadata indexer.

**Deposit Modal USDC balance** — The wallet's USDC balance is pulled from the SIM balances response in real-time, shown to users before they confirm a deposit.

#### Endpoint 2: `/beta/svm/transactions/{address}`

**Vault Activity Feed** (Vault detail page) — Recent wallet transactions from SIM are parsed by `inferIxFromLogs()`, which inspects Solana program log messages inside `raw_transaction.meta.logMessages` to classify each transaction: `deposit`, `withdraw`, `sync_nav`, or prediction `swap`. This activity timeline appears on every vault detail page.

**15-Day USDC Flow Chart** (Portfolio page) — `inferWalletUsdcFlow()` reads `preTokenBalances` / `postTokenBalances` deltas from SIM transaction data to reconstruct the wallet's deposit/withdrawal history across vaults — without any centralised event database. That history drives the 15-day portfolio area chart.

#### Webhook Receiver: `POST /api/webhooks/dune-sim`

A live push endpoint built into the Next.js API layer. Register it in the Dune SIM dashboard (Subscriptions → Webhooks) to stream on-chain transaction events into Axiom in real-time — no polling. Incoming events appear immediately on the Transparency Dashboard's live event log (polled every 8 seconds from `GET /api/webhooks/dune-sim`).

```
Dune SIM data flow across the product
────────────────────────────────────────────────────────────
Wallet connects
      │
      ├─▶  GET /beta/svm/balances/{address}
      │         └─▶ Token Holdings table  (symbol, price, USD value per token)
      │         └─▶ Wallet USDC balance   (shown in Deposit Modal)
      │
      ├─▶  GET /beta/svm/transactions/{address}
      │         └─▶ Vault Activity Feed   (log-parsed: deposit / withdraw / swap)
      │         └─▶ 15-day USDC flow chart (pre/post token balance deltas)
      │
      └─▶  POST /api/webhooks/dune-sim   (Dune SIM push → live event log)
```

Key files: `lib/services/dune-sim.ts` · `hooks/useWalletBalances.ts` · `hooks/useTransactionHistory.ts` · `app/api/webhooks/dune-sim/route.ts`

---

### RPC Fast

> Sub-100ms Solana RPC with two modes: poll and stream.

**Poll mode (always active):** Every RPC call in the frontend (`getParsedTransaction`, `getAccountInfo`, vault state reads) and the engine routes through the RPC Fast HTTP endpoint. Priority chain: `RPC_FAST_HTTP_URL` → `SOLANA_RPC_URL` → public devnet.

**Stream mode (Yellowstone gRPC):** When `RPC_FAST_GRPC_URL` is set, the engine boots a Yellowstone gRPC subscription over all vault PDAs. The moment a vault account changes on-chain (a deposit, a withdrawal, a sync), the subscription fires — triggering an immediate NAV recalculation and `sync_nav()` transaction, bypassing the 30-minute cron entirely. The Transparency Dashboard shows a live `WS Stream Active` pill when the stream is healthy.

```
RPC Fast stream mode
──────────────────────────────────────────────────────
Yellowstone gRPC  subscribe(vault PDAs)
      │
      │  account change detected  (e.g. user deposit)
      ▼
immediate NAV recalculation  (no cron wait)
      │
sync_nav() transaction submitted
      │
frontend polls /api/transparency  (20s interval)
      ▼
Transparency page updated in < 25 seconds end-to-end
```

Key files: `lib/spectra/cluster-url.ts` · `engine/src/services/rpc-fast-stream.ts` · `engine/src/index.ts`

---

## On-Chain Program — Spectra

Custom Anchor program. Non-custodial vault mechanics on Solana.

**Program ID:** `JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH`

**Share tokens:** Each vault has its own Token-2022 share mint. Depositing mints shares. Redeeming burns shares and releases proportional USDC.

**NAV math:**
```
Price Per Share (PPS)  =  total_assets / total_shares   [9-decimal precision]
Shares minted on deposit  =  amount × total_shares / total_assets
USDC returned on redeem   =  shares × total_assets / total_shares
```

**Performance fee:** Charged only above the high-water mark (initial 1.000000 PPS). Minted as additional shares to the fee recipient — no USDC exits the vault mid-cycle.

**Instructions:**
`deposit` · `withdraw` · `sync_nav` · `collect_performance_fee` · `bootstrap_vault` · `initialize_strategy_config` · `pause` · `unpause`

**PDA layout:**
```
[b"vault",        vault_id (8 bytes LE)]  →  Vault state
[b"shares_mint",  vault_pda]              →  Token-2022 share mint
[b"asset_vault",  vault_pda]              →  USDC ATA (Token Program)
[b"strategy",     vault_pda]              →  Strategy config (prob bands, allocations)
```

---

## Key Pages

| Page | URL | What You'll See |
|------|-----|-----------------|
| **Home** | `/` | Hero, vault overview, how it works, "set it forget it" flow |
| **Vaults** | `/vaults` | Live on-chain TVL, PPS, risk grades, exposure venues for all 3 vaults |
| **Vault Detail** | `/vaults/[id]` | Deposit/Withdraw modals, live PPS chart, Dune SIM activity feed, strategy agent card |
| **Portfolio** | `/portfolio` | Your share positions, redeemable value, P&L, Dune SIM token holdings table, 15-day flow chart |
| **Transparency** | `/transparency` | Engine health, NAV reconciliation, trade decisions, execution quality (expected vs filled), Dune SIM integration section + live webhook event log |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **UI / Animation** | Framer Motion, Recharts, Radix UI, Lucide, Three.js (shader backdrop) |
| **Data** | TanStack Query v5, Zustand |
| **Wallet** | `@solana/wallet-adapter-react` + UI |
| **On-Chain** | Anchor/Rust, Token-2022, SPL Token Program |
| **Engine** | Node.js, TypeScript, node-cron, Express |
| **AI** | Claude 3.5 Haiku — market opportunity scoring within strategy guardrails |
| **Analytics** | PostHog |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Solana CLI (for devnet program deploy)
- A Solana wallet (Phantom / Backpack) set to Devnet

### 1. Clone and install

```bash
git clone https://github.com/your-org/axiom-vaults
cd axiom-vaults
npm install
cd engine && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Required:

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Jupiter — single key from developers.jup.ag covers all APIs
JUPITER_API_KEY=your-key-here

# Dune SIM — from sim.dune.com
DUNE_SIM_API_KEY=your-key-here

# Dune SIM webhook shared secret (set the same value in Dune SIM dashboard)
DUNE_SIM_WEBHOOK_SECRET=your-secret-here
```

Optional (enables RPC Fast stream mode):

```env
RPC_FAST_HTTP_URL=https://your-endpoint.rpcfast.com
RPC_FAST_GRPC_URL=https://your-grpc.rpcfast.com   # enables Yellowstone streaming
```

### 3. Initialize devnet vaults

```bash
# Deploys program and bootstraps all three vault PDAs
npm run init:vaults:devnet
```

### 4. Run the frontend

```bash
npm run dev
# → http://localhost:3000
```

### 5. Run the strategy engine

```bash
cd engine
npm run dev
# → Express health API on :3001
# → First strategy scan runs in ~30 seconds
```

### 6. Register Dune SIM webhook (optional)

In the [Dune SIM dashboard](https://sim.dune.com) under **Subscriptions → Webhooks**, register:
```
https://<your-domain>/api/webhooks/dune-sim
```
Use the same value as `DUNE_SIM_WEBHOOK_SECRET`. Incoming events will appear live on the Transparency page.

---

## Transparency Runbook

The Transparency Dashboard at `/transparency` surfaces everything the engine does in real-time.

**Verify it's healthy:**

```bash
# Engine health
curl http://localhost:3001/health

# Full transparency dump
curl http://localhost:3001/api/transparency

# Frontend proxy (used by the dashboard)
curl http://localhost:3000/api/engine/transparency

# Dune SIM webhook event log
curl http://localhost:3000/api/webhooks/dune-sim
```

**What to check in the dashboard:**
- **NAV Reconciliation** — Computed NAV, Synced NAV, delta per vault. `verified` = healthy. `degraded` shows why.
- **Recent Decisions** — Every open/skip/exit/harvest with reason code, score, and confidence.
- **Execution Quality** — Expected price vs filled price, slippage in bps, Solscan link per trade.
- **Dune SIM section** — Endpoint documentation + live webhook event log.

**Degraded cause codes:**
- `prediction_api_fallback` — Engine used cached position values (Jupiter API unavailable).
- `liquidity_sync_delta` — Synced NAV intentionally limited to redeemable idle USDC; computed NAV includes positions.

---

## Project Structure

```
axiom-vaults/
├── app/
│   ├── api/
│   │   ├── engine/transparency/    # Proxies engine API to frontend
│   │   └── webhooks/dune-sim/      # Dune SIM webhook receiver + event log GET
│   ├── portfolio/                   # Portfolio page
│   ├── transparency/                # Transparency dashboard
│   └── vaults/[id]/                 # Vault detail pages
├── components/
│   ├── layout/Topbar.tsx            # Navigation
│   └── vault/                       # VaultCard, DepositModal, WithdrawModal,
│                                    # RiskRatingPanel, ExposureVenues, VaultTransparencyPanel
├── engine/
│   └── src/
│       ├── jobs/                    # market-scanner · nav-calculator
│       │                            # position-manager · yield-router
│       └── services/               # jupiter-lend · rpc-fast-stream
├── lib/
│   ├── services/dune-sim.ts         # Dune SIM client (balances, txns, flow inference, webhook)
│   └── spectra/                     # Anchor client, PDA derivation, constants
├── hooks/
│   ├── useWalletBalances.ts         # Dune SIM balances (30s refresh)
│   └── useTransactionHistory.ts    # Dune SIM + RPC merged tx history (90s refresh)
└── constants/                       # Vault configs (names, allocations, risk sheets, APY targets)
```

---

## Hackathon Tracks

| Track | Why We Qualify |
|-------|---------------|
| **Global Hackathon** | Novel DeFi primitive — prediction market ETFs for passive investors, fully on-chain and autonomous |
| **Jupiter** | Five Jupiter APIs integrated end-to-end: Prediction, Trigger, Lend/Earn, Price, Tokens — Jupiter IS the product loop |
| **Dune SIM** | Two SIM endpoints (`/beta/svm/balances`, `/beta/svm/transactions`) used across Token Holdings, Activity Feed, Portfolio Chart, and Deposit Modal; plus a live webhook receiver |
| **RPC Fast** | HTTP endpoint for all Solana RPC calls + optional Yellowstone gRPC stream for real-time vault monitoring |

---

<div align="center">

Built at **Colosseum Hackathon 2026**

**Axiom Vaults** · Solana Devnet · *Reality is a new asset class.*

</div>
