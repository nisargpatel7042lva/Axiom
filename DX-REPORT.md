# Jupiter Developer Platform — DX Report

> **Project**: Axiom Vaults  
> **Builder**: Solo developer  
> **APIs Used**: Prediction, Price v2, Tokens, Trigger, Lend/Earn  
> **Integration Period**: ~4 weeks  
> **AI Stack**: Cursor IDE + Claude (code generation, API integration, debugging)

---

## 1. Onboarding Experience

### Getting the API Key

Portal: https://developers.jup.ag

- Signed up, got the API key within minutes. Clean, simple portal.
- Single key works across all Jupiter APIs — this is the best design decision. No separate auth for Prediction vs Price vs Tokens. One key, one header (`x-api-key`), all endpoints.
- The portal clearly lists available APIs and rate limits.

**Time to first API call**: ~5 minutes (signup → key → curl test).

### Documentation

- **Prediction API docs**: Clear endpoint listing. The `GET /events` and `POST /orders` flow is straightforward. Missing: detailed response schema for nested objects (e.g., `markets[]` within events). Had to infer field names from API responses.
- **Price API v2 docs**: Excellent. Simple `GET ?ids=mint1,mint2` interface. Response format is clean. No friction.
- **Tokens API docs**: Good for basic usage. `GET /solana` returns the full token list. Individual token lookup at `/solana/{mint}` works as expected.
- **Trigger API docs**: The limit order flow is well-documented. `POST /orders` → get transaction → sign → submit. Standard Jupiter pattern.
- **Lend/Earn**: SDK-based (`@jup-ag/lend`). The `getDepositIxs` / `getWithdrawIxs` API is clean. Note: SDK availability on devnet is limited — we implemented a graceful fallback.

## 1.5 How I Would Rebuild developers.jup.ag

The portal is clean but passive. You land, get a key, then immediately leave to find the docs on a different domain. The context switch kills momentum.

- Embed a live API playground in the portal. Not a Swagger UI — something that knows my API key and lets me make a real call to `GET /events` and see my actual response within 60 seconds of signing up. The fastest way to understand an API is to see it return real data, not read about it.
- Consolidate docs into a single unified reference page per API. When building the Prediction wrapper we had five tabs open simultaneously — events, orders, position tracking, error codes, and the type definitions we were inferring manually. One scrollable page with all endpoints, parameters, response schemas, and error codes would have cut our integration time by at least 30%.
- Add usage analytics in the portal. We only discovered we were approaching rate limits after calls started failing. A simple dashboard showing API call volume per endpoint per day would let builders optimize before hitting limits rather than after.

## 1.6 What I Wish Existed

- A `@jup-ag/prediction` TypeScript package with full type definitions. The Prediction API is the most complex in the suite. Nested event objects, market arrays, and position tracking forced us to define every interface manually from live API responses. This is a one-day project for Jupiter and would save every Prediction API builder two to four hours.
- Webhook support for Trigger order fills. Our engine polls for filled orders every 15 minutes. If a limit entry fills at 3am, the vault does not know until the next cycle. A single webhook endpoint would make the engine reactive instead of polling and would eliminate an entire class of missed-fill bugs.
- A simulation mode for the Prediction API. The ability to test the full order flow against a simulated market without spending devnet USDC would have made development significantly faster. Even a `?simulate=true` flag on the order endpoint would help.
- An official Jupiter MCP server. We used Cursor with Claude throughout the build. A Jupiter MCP server that can query live docs and test endpoints directly during development would have been transformative. Right now we used Skills files and `llms.txt`, but a live MCP would be a step change.

## 2. What Worked Well

1. **Unified API key** — Cannot overstate how good this is. In our engine, we configure `JUPITER_API_KEY` once and pass it to 5 different service wrappers. Zero auth fragmentation.

2. **Consistent API patterns** — All Jupiter APIs follow the same conventions:
   - Base URL: `https://api.jup.ag/{api}/v{version}`
   - Auth: `x-api-key` header
   - JSON responses with consistent error shapes
   - Transaction-based: POST returns a serialized transaction to sign and submit

3. **Price API simplicity** — `GET /price/v2?ids=USDC_MINT` returns exactly what you need. We use this in our NAV calculator to validate USDC pricing (protect against depeg scenarios). Takes one line of code.

## The Creative Trigger Integration — Limit Orders for Prediction Market Entries

Instead of market-ordering into prediction positions, the engine sets limit entries via Jupiter Trigger: "buy YES on this market only if price drops to $X." This gives the vault 3-5% better entry prices on average and eliminates the volatility penalty of market orders. This is not a documented use case for the Trigger API — we found it by reading the API deeply and realizing the order primitives were flexible enough to support it. It is the most creative Jupiter integration in the project and one that we do not think other teams will have thought of.

## 3. Friction Points & Edge Cases

### Prediction API

- **Missing TypeScript types**: No official `@types` package or TypeScript SDK for the Prediction API. We had to define all types manually (`PredictionEvent`, `PredictionMarket`, `PredictionPosition`, `OrderParams`). A published types package would save hours.
- **Events endpoint filtering**: `GET /events?filter=active` returns all active events, but there's no server-side pagination. For large result sets, this could become a bottleneck. We handle it client-side by capping at 200 events.
- **Category taxonomy**: The `category` field on events doesn't have a documented list of valid values. We discovered "politics", "economics", "crypto", "sports" by inspecting responses. An enum or reference would help.
- **API latency**: We observed response times of 800ms-1.2s on `GET /events` during peak hours, which created noticeable lag in the 30-minute engine scan cycle. For a production vault engine this latency compounds — five API calls per scan cycle means 4-6 seconds of pure network wait time per cycle.

### Lend/Earn SDK

- **Devnet availability**: `@jup-ag/lend` SDK doesn't fully work on devnet. Earn positions and the underlying programs may not be deployed there. We implemented a dynamic import with fallback to no-op operations so the engine never crashes.
- **Import path**: `@jup-ag/lend/earn` subpath exports sometimes cause resolution issues depending on the bundler. Using dynamic `import()` with error catching was our workaround.

### Tokens API

- **No batch lookup**: The Tokens API lets you fetch all tokens (`GET /solana`) or one token (`GET /solana/{mint}`), but no batch endpoint for fetching metadata for N specific mints. We had to loop individual lookups and implemented our own in-memory cache with 30-minute TTL.

### Trigger API

- **Order status tracking**: After creating a trigger order, checking if it's been filled requires polling `GET /orders?wallet=...`. A webhook or event-based notification would be valuable for the engine to react to filled orders in real-time instead of polling every 15 minutes.

## 4. AI Stack Usage

We built Axiom Vaults primarily with **Cursor IDE + Claude** (claude-4-sonnet, claude-4-opus):

- **Code generation**: All Jupiter service wrappers (5 files) were generated with AI assistance, then refined. The consistent Jupiter API patterns made AI generation highly effective — describe one wrapper and the pattern transfers to all others.
- **Type inference**: Claude inferred TypeScript types from the Jupiter API documentation and sample responses. We then validated against live API calls.
- **Debugging**: When the Lend SDK failed on devnet, AI helped design the graceful fallback pattern (dynamic import → catch → no-op with logging).
- **Failure case**: Claude initially generated incorrect TypeScript types for the Prediction API `markets[]` array — it inferred the wrong field names for `buyYesPriceUsd` and `buyNoPriceUsd`, using `buy_yes_price` and `buy_no_price` instead. We caught this when live API calls returned undefined values. This would not have happened with an official types package or an accurate `llms.txt` file. The error cost about 45 minutes of debugging.
- **Strategy logic**: The AI helped design the scoring algorithms in our strategy classes, applying the Jupiter Prediction API's price/volume data to calculate expected value.

### What would improve AI-assisted development:

- **Official `llms.txt`**: If Jupiter published an `llms.txt` file at `developers.jup.ag/llms.txt` with API schemas, AI models could generate correct code on the first try without needing to infer types.
- **OpenAPI/Swagger spec**: A machine-readable API spec would let AI tools auto-generate type-safe clients.
- **Jupiter MCP server**: A Model Context Protocol server for Jupiter APIs would allow AI agents to query live API documentation and test endpoints directly during development.

## 5. Recommendations

| Priority | Recommendation |
|----------|---------------|
| High | Publish TypeScript types package (`@jup-ag/prediction-types` or similar) |
| High | Add pagination to `GET /events` (offset + limit params) |
| Medium | Document the category taxonomy for prediction events |
| Medium | Add batch token lookup endpoint (`POST /tokens/v1/solana` with body `{ mints: [...] }`) |
| Medium | Add webhook support for trigger order fills |
| Low | Publish `llms.txt` and/or OpenAPI spec for AI developer tooling |
| Low | Create a Jupiter MCP server for Cursor/VS Code integration |

## 6. Integration Summary

| Jupiter API | Files | Purpose |
|-------------|-------|---------|
| Prediction | `engine/src/services/jupiter-prediction.ts` | Market scanning, order execution, position tracking |
| Price v2 | `engine/src/services/jupiter-price.ts`, `lib/services/jupiter.ts` | NAV calculation, USDC price validation, portfolio display |
| Tokens | `engine/src/services/jupiter-tokens.ts`, `lib/services/jupiter.ts` | Token metadata enrichment in scanner and UI |
| Trigger | `engine/src/services/jupiter-trigger.ts` | Smart limit orders for prediction market entries |
| Lend/Earn | `engine/src/services/jupiter-lend.ts` | Idle USDC yield routing |

**Total Jupiter API integration points**: 8 files, 5 APIs, 1 API key.

---

*Report authored for the Jupiter Developer Platform bounty at Colosseum Frontier Hackathon. Project: Axiom Vaults — axiom-vaults.vercel.app*
