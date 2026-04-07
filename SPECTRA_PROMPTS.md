# Spectra Vaults — Cursor + Claude Development Prompts

> **Product**: Spectra Vaults — The first set-and-forget prediction market ETFs on Solana.
> **Stack**: Next.js 16 / React 19 / Tailwind v4 / Anchor / Rust / Jupiter APIs / Solana Vault Standard
> **Timeline**: 4 weeks, solo builder
> **Target**: Colosseum Hackathon — DeFi Track

---

## PROMPT 0 — PROJECT MASTER CONTEXT (paste first in every new chat)

```
You are helping me build "Spectra Vaults" — the first set-and-forget prediction market ETFs on Solana, for a Colosseum hackathon (DeFi track). I am a solo builder with a 4-week timeline.

PRODUCT OVERVIEW:
- Users deposit USDC into themed vaults ("Safe Consensus", "Macro Contrarian", "Yield Maximizer")
- Each vault auto-manages a diversified portfolio of prediction market positions via Jupiter Prediction API
- Idle USDC earns yield via Jupiter Lend (Earn)
- Users receive SPL vault share tokens (Token-2022) representing proportional ownership
- Strategy engine runs off-chain (Node.js), scanning markets, executing trades, routing idle USDC to lending, computing NAV
- Zero management fee, performance fee only above high-water mark
- Vault tokens are composable SPL tokens

ARCHITECTURE (3 layers):
1. ON-CHAIN: Anchor vault program (deposit USDC → mint shares, redeem shares → withdraw USDC, store vault state + strategy config)
2. BACKEND: Node.js strategy engine with cron jobs — market scanner, position manager, yield router, NAV calculator
3. FRONTEND: Next.js 16 app — vault catalog, deposit/withdraw modal, portfolio dashboard, performance charts

TECH STACK:
- Frontend: Next.js 16, React 19, Tailwind CSS v4, Radix UI, Recharts, Framer Motion, Zustand
- Wallet: @solana/wallet-adapter-react + @solana/wallet-adapter-react-ui
- Solana: @solana/web3.js 1.95.3, @coral-xyz/anchor ^0.31.1, @solana/spl-token ^0.4.13
- Backend: Node.js, cron jobs, Jupiter REST APIs
- On-chain: Anchor (Rust), Token-2022 for vault shares
- Deployment: Solana devnet for hackathon

KEY APIS:
- Jupiter Prediction API: https://api.jup.ag/prediction/v1 (GET /events, GET /markets/{id}, POST /orders, GET /positions)
- Jupiter Lend SDK: @jup-ag/lend (getDepositIxs, getWithdrawIxs from "@jup-ag/lend/earn")
- Jupiter Lend REST: deposit/withdraw/mint/redeem endpoints

3 VAULT STRATEGIES:
1. "Safe Consensus" — buys >85% probability events, low risk, targets 8-15% APY
2. "Macro Contrarian" — targets mispriced 40-65% probability events in politics/economics, higher risk
3. "Yield Maximizer" — 70% Jupiter Lend, 30% in >75% conviction predictions

NAV FORMULA:
NAV = (active prediction positions at current market price) + (USDC in Jupiter Lend + accrued yield) + (idle USDC)
Price Per Share (PPS) = NAV / total vault shares outstanding

DESIGN SYSTEM:
- Dark theme: bg #080c14, text #e8edf5, muted #8b9cb3
- Accent: #00e5c3 (teal/mint green)
- Borders: white/5 or #00e5c3/30
- Cards: bg #0d1420 with border-[#1a2235]
- Font: DM Sans
- Rounded corners: xl for buttons, lg for cards

COMPETITIVE CONTEXT:
- ZEIT.FINANCE does this on Polygon (ERC-4626 vaults for prediction markets) but has no TVL
- Robin Markets does yield-on-idle on Berachain
- Nobody has built this on Solana
- Capitola won 1st Place Consumer at Colosseum with just a prediction market aggregator
- We are building aggregation + vault + yield + automation — more ambitious

The existing codebase is a Next.js project called "flowr" at /home/mysterioxplorer/flowr. We will be transforming/extending this into Spectra Vaults.
```

---

## PROMPT 1 — RUST / ANCHOR: Vault Smart Contract

```
CONTEXT: Paste PROMPT 0 above first, then this prompt.

TASK: Build the Spectra Vaults Anchor program (Rust) for Solana devnet.

PROGRAM REQUIREMENTS:

1. VAULT STATE (PDA):
   - authority: Pubkey (strategy engine wallet, can execute trades)
   - asset_mint: Pubkey (USDC mint)
   - shares_mint: Pubkey (Token-2022 vault share token)
   - asset_vault: Pubkey (PDA token account holding USDC)
   - total_assets: u64 (synced by authority from off-chain NAV calculation)
   - total_shares: u64 (total shares outstanding)
   - vault_id: u64 (unique identifier)
   - strategy_type: u8 (0 = Safe Consensus, 1 = Macro Contrarian, 2 = Yield Maximizer)
   - high_water_mark: u64 (for performance fee calculation, 6 decimals)
   - performance_fee_bps: u16 (basis points, e.g., 1000 = 10%)
   - is_paused: bool
   - bump: u8

2. INSTRUCTIONS:
   a) initialize_vault — creates vault PDA, shares mint (Token-2022, 9 decimals), asset vault token account. Only admin.
   b) deposit — user sends USDC, receives proportional shares. shares_to_mint = (deposit_amount * total_shares) / total_assets. If first deposit, 1:1 ratio.
   c) withdraw — user burns shares, receives proportional USDC. usdc_to_return = (shares_burned * total_assets) / total_shares. Transfers from asset_vault.
   d) sync_nav — authority-only. Updates total_assets based on off-chain NAV computation. This is how the vault knows the value of deployed positions.
   e) pause / unpause — authority-only. Prevents deposits/withdrawals when paused (e.g., during rebalancing).
   f) collect_performance_fee — authority-only. If current PPS > high_water_mark, mint fee shares to authority. Update HWM.

3. STRATEGY REGISTRY (separate PDA per vault):
   - vault: Pubkey (reference to vault)
   - min_probability: u16 (e.g., 8500 = 85%)
   - max_probability: u16 (e.g., 10000 = 100%)
   - max_position_pct: u16 (max % of vault in single position, e.g., 1000 = 10%)
   - lend_allocation_pct: u16 (% routed to Jupiter Lend, e.g., 7000 = 70%)
   - categories: Vec<String> (allowed categories: "crypto", "politics", "sports", etc.)
   - is_active: bool

4. EVENTS (emit via Anchor events):
   - DepositEvent { vault, user, amount, shares_minted, timestamp }
   - WithdrawEvent { vault, user, shares_burned, amount_returned, timestamp }
   - NavSyncEvent { vault, old_total_assets, new_total_assets, pps, timestamp }
   - StrategyUpdateEvent { vault, strategy_type, timestamp }

5. SECURITY:
   - All authority-only instructions check signer == vault.authority
   - Deposit/withdraw check is_paused == false
   - Overflow checks on all arithmetic (use checked_mul, checked_div)
   - shares_to_mint rounds DOWN (protects existing holders)
   - usdc_to_return rounds DOWN (protects vault)

TECHNICAL REQUIREMENTS:
- Use Anchor ^0.31.1
- Token-2022 for shares mint (not legacy SPL token)
- USDC on devnet: use the standard devnet USDC mint or create a test mint
- Program should compile with `anchor build` targeting Solana 1.18+
- Include comprehensive tests in tests/ using anchor's test framework (TypeScript)
- Create the program in a new directory: /home/mysterioxplorer/flowr/programs/spectra-vault/

FOLDER STRUCTURE:
programs/spectra-vault/
├── Cargo.toml
├── Xargo.toml
├── src/
│   ├── lib.rs          (program entry, declare_id!)
│   ├── state.rs        (VaultState, StrategyConfig account structs)
│   ├── instructions/
│   │   ├── mod.rs
│   │   ├── initialize.rs
│   │   ├── deposit.rs
│   │   ├── withdraw.rs
│   │   ├── sync_nav.rs
│   │   ├── pause.rs
│   │   └── collect_fee.rs
│   ├── errors.rs       (custom error codes)
│   └── events.rs       (event structs)
tests/
└── spectra-vault.ts    (Anchor TypeScript tests)

Do NOT use placeholder code. Write the full, working Anchor program. Start with state.rs and errors.rs, then implement each instruction.
```

---

## PROMPT 2 — BACKEND: Strategy Engine + Jupiter Integration

```
CONTEXT: Paste PROMPT 0 above first, then this prompt.

TASK: Build the Spectra Vaults strategy engine — a Node.js/TypeScript backend that scans prediction markets, manages positions, routes idle capital to yield, and computes NAV.

DIRECTORY: /home/mysterioxplorer/flowr/engine/

ARCHITECTURE:

engine/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts              (main entry, starts cron jobs)
│   ├── config.ts             (env vars, vault configs, constants)
│   ├── services/
│   │   ├── jupiter-prediction.ts  (Jupiter Prediction API wrapper)
│   │   ├── jupiter-lend.ts        (Jupiter Lend SDK wrapper)
│   │   ├── vault-contract.ts      (Anchor client for on-chain vault)
│   │   └── solana.ts              (connection, keypair loading)
│   ├── strategies/
│   │   ├── base-strategy.ts       (abstract strategy interface)
│   │   ├── safe-consensus.ts      (>85% probability filter)
│   │   ├── macro-contrarian.ts    (40-65% probability, politics/economics)
│   │   └── yield-maximizer.ts     (70% lend, 30% predictions)
│   ├── jobs/
│   │   ├── market-scanner.ts      (cron: scan markets every 30 min)
│   │   ├── position-manager.ts    (cron: execute/close positions)
│   │   ├── yield-router.ts        (cron: sweep idle USDC to Jupiter Lend)
│   │   └── nav-calculator.ts      (cron: compute NAV, call sync_nav on-chain)
│   ├── types/
│   │   └── index.ts               (shared types)
│   └── utils/
│       ├── logger.ts
│       └── retry.ts               (exponential backoff for API calls)

DETAILED SPECS:

1. JUPITER PREDICTION API WRAPPER (jupiter-prediction.ts):
   Base URL: https://api.jup.ag/prediction/v1
   Required header: x-api-key

   Functions:
   - getActiveEvents(category?: string, provider?: 'polymarket' | 'kalshi'): Promise<Event[]>
     → GET /events?category={cat}&filter=active
   - getMarket(marketId: string): Promise<Market>
     → GET /markets/{marketId}
   - createOrder(params: { ownerPubkey: string, marketId: string, isYes: boolean, isBuy: boolean, depositAmount: string, depositMint: string }): Promise<{ transaction: string }>
     → POST /orders
   - getPositions(ownerPubkey: string): Promise<Position[]>
     → GET /positions?ownerPubkey={pubkey}
   - sellPosition(params: { ownerPubkey: string, marketId: string, isYes: boolean, contracts: string }): Promise<{ transaction: string }>
     → POST /orders with isBuy: false

2. JUPITER LEND WRAPPER (jupiter-lend.ts):
   Uses @jup-ag/lend SDK.

   Functions:
   - depositToEarn(connection, signer, amount: BN): Promise<TransactionInstruction[]>
     → getDepositIxs({ connection, signer, asset: USDC_MINT, amount })
   - withdrawFromEarn(connection, signer, amount: BN): Promise<TransactionInstruction[]>
     → getWithdrawIxs({ connection, signer, asset: USDC_MINT, amount })
   - getEarnBalance(connection, signer): Promise<number>
     → Read user's earn position

3. MARKET SCANNER (market-scanner.ts):
   Runs every 30 minutes.

   For each vault strategy:
   a) Fetch all active events from Jupiter Prediction API
   b) Filter by strategy criteria:
      - Safe Consensus: buyYesPriceUsd > 0.85, volume > 100000, resolves in < 30 days
      - Macro Contrarian: buyYesPriceUsd 0.40-0.65, category in ["politics","economics","crypto"], volume > 50000
      - Yield Maximizer: buyYesPriceUsd > 0.75, volume > 200000
   c) Score markets by: probability * volume_weight * time_to_resolution_score
   d) Store top opportunities in memory (or simple JSON file)
   e) Log scan results

4. POSITION MANAGER (position-manager.ts):
   Runs every 15 minutes.

   For each vault:
   a) Check current positions via Jupiter GET /positions
   b) Check for markets that have resolved → claim winnings
   c) Check for new opportunities from scanner
   d) If opportunity exists and vault has available capital:
      - Calculate position size (max_position_pct of vault NAV)
      - Withdraw USDC from Jupiter Lend if needed
      - Call Jupiter POST /orders to open position
      - Sign and submit the returned transaction
   e) If a position has moved against strategy (e.g., probability dropped below threshold):
      - Sell the position
   f) Log all trades

5. YIELD ROUTER (yield-router.ts):
   Runs every 1 hour.

   For each vault:
   a) Check idle USDC in vault's token account
   b) Based on strategy's lend_allocation_pct, calculate how much should be in Jupiter Lend
   c) If idle > target: deposit excess to Jupiter Lend
   d) If idle < minimum buffer (keep 5% as buffer for gas/positions): withdraw from Lend

6. NAV CALCULATOR (nav-calculator.ts):
   Runs every 30 minutes (after market scanner).

   For each vault:
   a) Fetch all active positions from Jupiter API → value at current market prices
   b) Fetch Jupiter Lend balance (principal + accrued yield)
   c) Fetch idle USDC in vault token account
   d) NAV = positions_value + lend_balance + idle_usdc
   e) Call sync_nav instruction on the Anchor program to update total_assets on-chain
   f) Log NAV, PPS, and breakdown

7. CONFIGURATION (.env.example):
   SOLANA_RPC_URL=https://api.devnet.solana.com
   VAULT_AUTHORITY_KEYPAIR_PATH=./keypair.json
   JUPITER_PREDICTION_API_KEY=your-key-from-portal.jup.ag
   VAULT_PROGRAM_ID=your-deployed-program-id
   SAFE_VAULT_ID=1
   CONTRARIAN_VAULT_ID=2
   YIELD_VAULT_ID=3

TECHNICAL REQUIREMENTS:
- TypeScript with strict mode
- Use node-cron for scheduling
- All API calls wrapped in retry logic with exponential backoff
- Proper error handling — engine should never crash, just log errors and retry
- Use @solana/web3.js 1.95.3 and @coral-xyz/anchor ^0.31.1
- Include a simple health check endpoint (Express, port 3001) so frontend can check if engine is running
- Package.json should include all dependencies with proper versions

Build the complete engine. Start with config.ts and types, then the service wrappers, then the strategy classes, then the cron jobs.
```

---

## PROMPT 3 — FRONTEND: Vault UI + Dashboard

```
CONTEXT: Paste PROMPT 0 above first, then this prompt.

TASK: Transform the existing Flowr Next.js app into the Spectra Vaults frontend. The app already has wallet connection, Tailwind v4, and a dark theme. We need to replace the Flowr LP dashboard with the Spectra Vaults interface.

EXISTING CODEBASE: /home/mysterioxplorer/flowr/
- Next.js 16, React 19, Tailwind v4
- Wallet adapter already configured
- Dark theme: bg #080c14, accent #00e5c3, cards #0d1420
- Has Radix UI, Recharts, Framer Motion, Lucide icons, Zustand

PAGES TO BUILD:

1. LANDING PAGE (app/page.tsx — replace existing):
   - Hero: "Spectra Vaults" title, tagline "Reality is a new asset class. Set and forget."
   - 3 feature pills: "Prediction Market ETFs", "Yield on Idle Capital", "Auto-Managed"
   - Stats bar: Total TVL, Active Markets, Average APY (mock data for now)
   - Connect wallet button → redirects to /vaults

2. VAULT CATALOG (app/vaults/page.tsx — new):
   - Grid of 3 vault cards:
     a) "Safe Consensus" — Shield icon, green accent, "Low Risk", description, current APY, TVL
     b) "Macro Contrarian" — TrendingUp icon, orange accent, "High Risk", description, current APY, TVL
     c) "Yield Maximizer" — Wallet icon, blue accent, "Medium Risk", description, current APY, TVL
   - Each card shows: name, risk level badge, strategy description (2 lines), current APY %, TVL, number of active positions
   - Click card → /vaults/[id] detail page

3. VAULT DETAIL PAGE (app/vaults/[id]/page.tsx — new):
   - Header: Vault name, risk badge, strategy description
   - Key metrics row: NAV, PPS, Total Shares, APY (since inception), TVL
   - DEPOSIT/WITHDRAW panel (right side or modal):
     - Tab: Deposit | Withdraw
     - Deposit: Enter USDC amount, show estimated shares to receive, "Deposit" button
     - Withdraw: Enter shares amount (or "Max"), show estimated USDC to receive, "Withdraw" button
     - Both trigger wallet signing via Anchor client
   - POSITIONS TABLE: List of current prediction market positions
     - Columns: Market Title, Side (YES/NO), Entry Price, Current Price, P&L, Status
     - Color code P&L green/red
   - PERFORMANCE CHART (Recharts):
     - Line chart of PPS over time (mock historical data for now)
     - Time filters: 7D, 30D, All
   - ALLOCATION BREAKDOWN:
     - Donut/pie chart showing: X% in Predictions, Y% in Jupiter Lend, Z% Idle USDC
   - ACTIVITY FEED:
     - Recent vault actions: "Opened YES on 'BTC > 100K by Dec'", "Deposited 500 USDC to Jupiter Lend", etc.

4. PORTFOLIO PAGE (app/portfolio/page.tsx — new):
   - Shows user's positions across all vaults
   - For each vault the user has deposited into:
     - Vault name, shares held, current value, P&L
   - Total portfolio value, total P&L

COMPONENTS TO BUILD:

components/spectra/
├── VaultCard.tsx          (vault catalog card)
├── VaultMetrics.tsx       (key metrics row)
├── DepositWithdraw.tsx    (deposit/withdraw panel with tabs)
├── PositionsTable.tsx     (active prediction positions)
├── PerformanceChart.tsx   (PPS line chart)
├── AllocationChart.tsx    (pie/donut breakdown)
├── ActivityFeed.tsx       (recent vault actions)
├── RiskBadge.tsx          (Low/Medium/High risk pill)
└── VaultStats.tsx         (landing page stats bar)

STATE MANAGEMENT (Zustand):

store/
├── vault-store.ts         (vault data, positions, NAV — fetched from API routes)
└── portfolio-store.ts     (user's deposits, shares, P&L)

API ROUTES (Next.js server-side, proxy to engine backend):

app/api/spectra/
├── vaults/route.ts           (GET: list all vaults with current stats)
├── vaults/[id]/route.ts      (GET: vault detail + positions + performance)
├── vaults/[id]/deposit/route.ts   (POST: build deposit tx)
├── vaults/[id]/withdraw/route.ts  (POST: build withdraw tx)
├── portfolio/route.ts        (GET: user's positions across vaults)
└── health/route.ts           (GET: check engine status)

DESIGN REQUIREMENTS:
- Consistent with existing dark theme (#080c14 bg, #00e5c3 accent, #0d1420 cards)
- Use Framer Motion for page transitions and card hover effects
- Responsive: mobile-first, works on 375px+
- Use Lucide icons throughout (Shield, TrendingUp, Wallet, ArrowUpRight, etc.)
- Loading skeletons for async data
- Toast notifications for deposit/withdraw success/error
- All amounts formatted with proper decimals (USDC = 2 decimals, shares = 4 decimals)

MOCK DATA:
For the hackathon demo, create realistic mock data in a lib/mock-data.ts file:
- 3 vaults with mock stats
- 5-8 sample prediction positions per vault (real market titles like "BTC > $100K by Dec 2026", "Fed cuts rates in Q3 2026")
- 30 days of mock PPS history (slight uptrend for Safe/Yield, volatile for Contrarian)
- Sample activity feed entries

Start by building the VaultCard component and the vault catalog page, then the detail page with deposit/withdraw.
```

---

## PROMPT 4 — SOLANA INTEGRATION: Anchor Client + Wallet Transactions

```
CONTEXT: Paste PROMPT 0 above first, then this prompt.

TASK: Build the TypeScript Anchor client that connects the frontend to the on-chain vault program, and the wallet transaction flow for deposits/withdrawals.

DIRECTORY: /home/mysterioxplorer/flowr/lib/spectra/

FILES TO CREATE:

lib/spectra/
├── idl.ts                 (paste the generated IDL from anchor build)
├── program.ts             (Anchor Program setup with wallet provider)
├── vault-client.ts        (high-level client wrapping all vault instructions)
├── types.ts               (TypeScript types matching on-chain state)
├── constants.ts           (program ID, USDC mint, vault PDAs, etc.)
└── hooks/
    ├── use-vault.ts       (React hook: fetch vault state)
    ├── use-deposit.ts     (React hook: deposit USDC to vault)
    ├── use-withdraw.ts    (React hook: withdraw from vault)
    └── use-portfolio.ts   (React hook: user's shares across vaults)

DETAILED SPECS:

1. PROGRAM SETUP (program.ts):
   - Create AnchorProvider from wallet-adapter's useAnchorWallet
   - Initialize Program with IDL and program ID
   - Export a getProgram(connection, wallet) function
   - Handle the case where wallet is not connected (return null)

2. VAULT CLIENT (vault-client.ts):
   Functions:

   a) getVaultState(program, vaultId): Promise<VaultState>
      - Derive vault PDA: [Buffer.from("vault"), assetMint.toBuffer(), new BN(vaultId).toArrayLike(Buffer, "le", 8)]
      - Fetch and deserialize the vault account

   b) getStrategyConfig(program, vaultPda): Promise<StrategyConfig>
      - Derive strategy PDA: [Buffer.from("strategy"), vaultPda.toBuffer()]
      - Fetch and deserialize

   c) deposit(program, vaultId, amount: BN, userPublicKey: PublicKey): Promise<TransactionSignature>
      - Build deposit instruction
      - Accounts: vault PDA, user token account (USDC), asset vault, shares mint, user shares ATA, token program (Token-2022), system program
      - Create user shares ATA if doesn't exist (getOrCreateAssociatedTokenAccount for Token-2022)
      - Sign and send transaction

   d) withdraw(program, vaultId, sharesAmount: BN, userPublicKey: PublicKey): Promise<TransactionSignature>
      - Build withdraw instruction
      - Burns user's shares, transfers proportional USDC from asset vault
      - Accounts: vault PDA, user shares ATA, shares mint, asset vault, user USDC ATA, token program, system program

   e) getUserShares(connection, sharesMint: PublicKey, userPublicKey: PublicKey): Promise<number>
      - Get user's Token-2022 shares balance

   f) previewDeposit(vaultState: VaultState, amount: BN): { sharesToReceive: BN, estimatedPPS: number }
      - Pure function: calculate shares to mint based on current vault state

   g) previewWithdraw(vaultState: VaultState, shares: BN): { usdcToReceive: BN, estimatedPPS: number }
      - Pure function: calculate USDC to return

3. REACT HOOKS:

   a) useVault(vaultId: number):
      - Returns: { vault: VaultState | null, strategy: StrategyConfig | null, loading: boolean, error: Error | null, refetch: () => void }
      - Polls every 30 seconds
      - Uses @tanstack/react-query

   b) useDeposit(vaultId: number):
      - Returns: { deposit: (amount: BN) => Promise<string>, loading: boolean, error: Error | null }
      - Handles wallet signing flow
      - Shows toast on success/error
      - Invalidates vault query cache after success

   c) useWithdraw(vaultId: number):
      - Returns: { withdraw: (shares: BN) => Promise<string>, loading: boolean, error: Error | null }
      - Same pattern as deposit

   d) usePortfolio():
      - Returns: { vaults: UserVaultPosition[], totalValue: number, totalPnl: number, loading: boolean }
      - Fetches user's share balance for each vault, calculates current value

4. CONSTANTS (constants.ts):
   export const SPECTRA_PROGRAM_ID = new PublicKey("..."); // After deploy
   export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mainnet USDC
   export const DEVNET_USDC_MINT = new PublicKey("..."); // Devnet test token
   export const VAULT_IDS = { SAFE: 1, CONTRARIAN: 2, YIELD: 3 };
   export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

5. TYPES (types.ts):
   Match the on-chain state structs exactly:
   - VaultState { authority, assetMint, sharesMint, assetVault, totalAssets, totalShares, vaultId, strategyType, highWaterMark, performanceFeeBps, isPaused, bump }
   - StrategyConfig { vault, minProbability, maxProbability, maxPositionPct, lendAllocationPct, categories, isActive }
   - UserVaultPosition { vaultId, vaultName, sharesHeld, currentValue, pnl, depositedAmount }

IMPORTANT:
- Token-2022 requires using TOKEN_2022_PROGRAM_ID, not the legacy TOKEN_PROGRAM_ID
- Associated Token Accounts for Token-2022 use getAssociatedTokenAddressSync with TOKEN_2022_PROGRAM_ID
- All BN math should use checked operations
- Handle devnet vs mainnet via environment variable NEXT_PUBLIC_SOLANA_NETWORK

Build the complete client. Start with types.ts and constants.ts, then vault-client.ts, then the hooks.
```

---

## PROMPT 5 — AI SCORING: Market Intelligence Layer (9/10 booster)

```
CONTEXT: Paste PROMPT 0 above first, then this prompt.

TASK: Build an AI-powered market scoring system that analyzes prediction market events and scores them for the vault strategies. This replaces simple probability threshold filters with intelligent analysis. This is the key differentiator that pushes the hackathon rating from 8 to 9+.

DIRECTORY: /home/mysterioxplorer/flowr/engine/src/ai/

FILES:

engine/src/ai/
├── market-scorer.ts       (main scoring orchestrator)
├── prompts.ts             (LLM prompt templates)
├── types.ts               (scoring types)
└── cache.ts               (cache scores to avoid repeated LLM calls)

HOW IT WORKS:

1. MARKET SCORER:
   When the market scanner finds events matching basic criteria (volume, time-to-resolution),
   pass them to the AI scorer before making position decisions.

   For each candidate market, call an LLM (Claude or GPT via API) with this information:
   - Market title and description
   - Current YES/NO prices (implied probability)
   - Volume (24h and all-time)
   - Time to resolution
   - Category
   - The vault's strategy type

   The LLM returns a structured score:

   {
     "conviction": 0-100,
     "mispricing_signal": -50 to +50,
     "resolution_clarity": 0-100,
     "reasoning": "string",
     "recommended_side": "YES" | "NO" | "SKIP",
     "risk_flags": string[]
   }

2. PROMPT TEMPLATES (for each strategy):

   SAFE CONSENSUS prompt:
   "You are a conservative prediction market analyst. Evaluate this market for a SAFE vault
   that only takes high-conviction, near-certain positions. Score harshly — only recommend
   markets where the outcome is almost guaranteed and the market is liquid enough to exit.
   Flag any ambiguity in resolution criteria."

   MACRO CONTRARIAN prompt:
   "You are a contrarian macro analyst. Evaluate this market for a vault that profits from
   mispriced political and economic events. Look for markets where the crowd is wrong —
   where base rates, historical precedent, or structural factors suggest the true probability
   differs from the market price by >10%. Be specific about WHY you think it's mispriced."

   YIELD MAXIMIZER prompt:
   "You are a risk-adjusted yield optimizer. Evaluate this market for a balanced vault.
   Only recommend markets that have high probability (>75%), resolve quickly (<14 days),
   and have enough volume to enter and exit cleanly. The goal is consistent small wins,
   not home runs."

3. SCORING INTEGRATION:
   In the strategy classes (safe-consensus.ts, etc.), after filtering by basic criteria,
   pass candidates to the AI scorer. Only open positions where:
   - conviction > 80 (Safe), > 60 (Contrarian), > 70 (Yield)
   - resolution_clarity > 70
   - risk_flags is empty or acceptable
   - recommended_side != "SKIP"

4. CACHING:
   - Cache scores by marketId + timestamp (expire after 6 hours)
   - Don't re-score markets that haven't changed price by >5%
   - Use a simple in-memory Map with TTL

5. COST CONTROL:
   - Use a small/fast model (Claude Haiku or GPT-4o-mini)
   - Batch markets per call (up to 5 markets per prompt)
   - Maximum 50 API calls per hour
   - Fallback to rules-based scoring if API is down

TECHNICAL:
- Use the Anthropic SDK (@anthropic-ai/sdk) or OpenAI SDK (openai)
- Structured output via JSON mode
- Timeout: 10 seconds per call
- .env: AI_PROVIDER=anthropic, AI_API_KEY=your-key, AI_MODEL=claude-3-haiku-20240307

Build the complete AI scoring system. This should plug into the existing strategy classes from PROMPT 2.
```

---

## PROMPT 6 — DEVOPS: Project Setup, Testing, Deployment

```
CONTEXT: Paste PROMPT 0 above first, then this prompt.

TASK: Set up the complete project structure, testing framework, and deployment pipeline for Spectra Vaults.

REQUIREMENTS:

1. MONOREPO STRUCTURE:
   /home/mysterioxplorer/flowr/        (root)
   ├── package.json                    (workspace root)
   ├── Anchor.toml                     (Anchor config for Solana programs)
   ├── programs/
   │   └── spectra-vault/              (Anchor/Rust program)
   ├── engine/                         (Node.js strategy engine)
   │   ├── package.json
   │   └── src/
   ├── app/                            (Next.js frontend — already exists)
   ├── components/                     (React components — already exists)
   ├── lib/
   │   └── spectra/                    (Anchor client + hooks)
   ├── tests/
   │   ├── spectra-vault.ts            (Anchor program tests)
   │   └── integration/
   │       └── vault-flow.ts           (end-to-end: deposit → trade → NAV sync → withdraw)
   └── scripts/
       ├── setup-devnet.sh             (airdrop SOL, create test USDC, initialize vaults)
       ├── init-vaults.ts              (script to initialize 3 vaults on devnet)
       └── seed-mock-data.ts           (populate mock positions for demo)

2. ANCHOR.TOML:
   [toolchain]
   anchor_version = "0.31.1"

   [features]
   resolution = true
   skip-lint = false

   [programs.devnet]
   spectra_vault = "your-program-id"

   [registry]
   url = "https://api.apr.dev"

   [provider]
   cluster = "devnet"
   wallet = "./keypair.json"

   [scripts]
   test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

3. SETUP SCRIPT (setup-devnet.sh):
   - Check Solana CLI is installed
   - Set cluster to devnet
   - Airdrop 5 SOL to authority keypair
   - Create test USDC mint (or use existing devnet USDC)
   - Mint test USDC to authority
   - Build and deploy the Anchor program
   - Run init-vaults.ts to create the 3 vaults
   - Print all addresses and config

4. TESTING:
   Anchor tests (tests/spectra-vault.ts):
   - Test initialize_vault (create vault, verify state)
   - Test deposit (first deposit 1:1, second deposit proportional)
   - Test withdraw (partial, full)
   - Test sync_nav (authority updates totalAssets)
   - Test pause/unpause (deposits fail when paused)
   - Test collect_performance_fee (only when PPS > HWM)
   - Test unauthorized access (non-authority can't sync/pause)

   Integration test (tests/integration/vault-flow.ts):
   - Initialize vault → deposit 1000 USDC → sync NAV to 1050 (simulating gains) → withdraw → verify user received > 1000

5. ENV FILES:
   Root .env.local:
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   NEXT_PUBLIC_SPECTRA_PROGRAM_ID=...
   NEXT_PUBLIC_USDC_MINT=...

   Engine .env:
   SOLANA_RPC_URL=https://api.devnet.solana.com
   VAULT_AUTHORITY_KEYPAIR_PATH=../keypair.json
   JUPITER_PREDICTION_API_KEY=...
   AI_PROVIDER=anthropic
   AI_API_KEY=...

6. PACKAGE.JSON (root — workspaces):
   Add workspace config to support both frontend and engine.
   Scripts:
   - "dev": starts Next.js frontend
   - "engine:dev": starts strategy engine
   - "test:program": runs Anchor program tests
   - "setup": runs setup-devnet.sh
   - "build:all": builds program + frontend

Set up the complete project structure. Create all config files, scripts, and test scaffolds. Make sure anchor build and npm run dev work.
```

---

## PROMPT 7 — DEMO: Mock Data + Pitch-Ready Demo Flow

```
CONTEXT: Paste PROMPT 0 above first, then this prompt.

TASK: Create realistic mock data and a polished demo flow for the Spectra Vaults hackathon submission. The demo needs to tell a compelling story in under 4 minutes.

REQUIREMENTS:

1. MOCK DATA (lib/mock-data.ts):

   3 Vaults with realistic stats:

   Safe Consensus:
   - TVL: $247,500 | APY: 12.3% (since inception, 45 days ago)
   - PPS: $1.0123 | Active positions: 6 | Status: Active

   Macro Contrarian:
   - TVL: $89,200 | APY: 34.7% (volatile, some losses some big wins)
   - PPS: $1.0347 | Active positions: 4 | Status: Active

   Yield Maximizer:
   - TVL: $412,800 | APY: 9.8%
   - PPS: $1.0098 | Active positions: 3 prediction + Jupiter Lend | Status: Active

   Sample Positions (use real-sounding market titles):
   - "Will BTC exceed $120,000 by September 2026?" — YES at $0.72, entry $0.65 → +10.8%
   - "Fed cuts interest rates in July 2026 FOMC" — YES at $0.88, entry $0.82 → +7.3%
   - "Solana daily active addresses exceed 5M by Q3 2026" — YES at $0.61, entry $0.55 → +10.9%
   - "ETH/BTC ratio above 0.04 by August 2026" — NO at $0.73, entry $0.68 → +7.4%
   - "US GDP growth Q2 2026 exceeds 2.5%" — YES at $0.91, entry $0.87 → +4.6%
   - "Trump wins 2028 Republican primary" — YES at $0.44, entry $0.38 → +15.8%

   PPS History (30 days):
   - Safe: steady uptrend from 1.0000 to 1.0123, small dips
   - Contrarian: volatile — 1.0000 → dip to 0.9850 → spike to 1.0500 → settle at 1.0347
   - Yield: gentle uptrend from 1.0000 to 1.0098

   Activity Feed:
   - "Opened YES position on 'BTC > $120K by Sep 2026' — 2,500 USDC"
   - "Deposited 15,000 USDC to Jupiter Earn — earning 6.2% APY"
   - "Closed YES position on 'SOL > $200 by June' — profit $340"
   - "NAV synced: $247,500 (+0.3% from last sync)"

   Allocation Breakdown (per vault):
   - Safe: 62% predictions, 33% Jupiter Lend, 5% idle
   - Contrarian: 78% predictions, 15% Jupiter Lend, 7% idle
   - Yield: 28% predictions, 67% Jupiter Lend, 5% idle

2. DEMO SCRIPT (docs/DEMO_SCRIPT.md):

   Write a step-by-step demo script for a 3-4 minute video:

   [0:00-0:30] HOOK
   - Show the problem: "$197M locked in Polymarket earning zero. $20B monthly volume. Your prediction capital sits idle."
   - Show the solution: "Spectra Vaults — prediction market ETFs. Deposit once, earn everywhere."

   [0:30-1:30] PRODUCT DEMO
   - Show vault catalog (3 themed vaults with real stats)
   - Click into "Safe Consensus" vault
   - Show active positions (real market titles, green P&L)
   - Show performance chart (uptrend)
   - Show allocation pie (predictions + lending + idle)

   [1:30-2:30] DEPOSIT FLOW
   - Connect wallet
   - Deposit 100 USDC into Safe Consensus vault
   - Show shares minted, transaction confirmed
   - Show portfolio page with position

   [2:30-3:30] TECH DEEP DIVE
   - Brief architecture diagram: "3 layers — Anchor vault on-chain, strategy engine, Next.js frontend"
   - Show the AI scoring: "Our AI analyzes 200+ markets and picks the highest conviction opportunities"
   - Show NAV sync: "Every 30 minutes, the strategy engine recomputes NAV and syncs on-chain"
   - Show Jupiter integration: "Built on Jupiter Prediction API + Jupiter Lend"

   [3:30-4:00] CLOSE
   - "Zero competition on Solana. ZEIT does this on Polygon. Robin on Berachain. Spectra is the first on Solana."
   - "Reality is a new asset class. Set it. Forget it. Earn."

3. PITCH NOTES (docs/PITCH.md):
   Write concise pitch talking points covering:
   - Problem (idle capital in prediction markets)
   - Solution (themed auto-managed vaults)
   - Why now (Jupiter Prediction API, $20B volume, prediction market DeFi is nascent)
   - Why Solana (Jupiter ecosystem, low fees, fast settlement)
   - Competitive advantage (first on Solana, AI-powered scoring, composable vault tokens)
   - Business model (performance fee above HWM)
   - Team (solo builder, background)

Create all mock data, the demo script, and the pitch document. Make the mock data feel real and impressive.
```

---

## HOW TO USE THESE PROMPTS

| Order | Prompt | What it builds | Est. time |
|-------|--------|----------------|-----------|
| 1st | PROMPT 0 + 6 | Project setup, config, scripts | Day 1-2 |
| 2nd | PROMPT 0 + 1 | Anchor vault program (Rust) | Day 3-7 |
| 3rd | PROMPT 0 + 4 | Anchor client + hooks (TypeScript) | Day 8-10 |
| 4th | PROMPT 0 + 2 | Strategy engine + Jupiter integration | Day 11-16 |
| 5th | PROMPT 0 + 5 | AI market scoring layer | Day 17-19 |
| 6th | PROMPT 0 + 3 | Frontend UI + dashboard | Day 20-25 |
| 7th | PROMPT 0 + 7 | Mock data + demo + pitch | Day 26-28 |

**Always paste PROMPT 0 first** in any new Cursor chat to give full context.

When starting a new chat for a specific prompt, paste:

```
<PROMPT 0 content here>

---

Now let's work on:

<PROMPT N content here>
```

This ensures Claude always has the full product context regardless of which component you're building.
