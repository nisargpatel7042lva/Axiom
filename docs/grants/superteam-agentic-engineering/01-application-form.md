# Superteam Agentic Engineering Grant Application

## Project Name

Axiom

## One-Liner

Axiom is a prediction market ETF on Solana - deposit USDC, pick a vault, and let the engine manage positions automatically.

## Elevator Pitch

Prediction markets are powerful but operationally hard for normal users. Axiom abstracts that complexity into strategy vaults. Users choose a risk profile, deposit USDC once, and our automated engine handles market selection, position sizing, rebalancing logic, and NAV updates on-chain.

## Problem Statement

Prediction markets have large volume and strong signal quality, but participation is still limited by execution complexity:

- Users must monitor markets constantly.
- Position management requires fragmented tooling.
- Risk control and diversification are difficult to do manually.
- Idle capital is often unproductive.

This creates a gap between market opportunity and actual user accessibility.

## Solution

Axiom provides vault-based, agentic exposure to prediction markets on Solana. Users deposit USDC into one of three strategy vaults:

- Safe Consensus
- Macro Contrarian
- Yield Maximizer

The engine then:

1. Scans live markets on a schedule.
2. Scores opportunities using strategy rules plus AI gating.
3. Allocates capital across opportunities.
4. Routes idle capital to Jupiter Lend for baseline yield.
5. Continuously computes and syncs NAV/PPS on-chain.

Net effect: one-click entry and exit, while strategy logic runs continuously in the background.

## Why This Is Agentic Engineering

Axiom is built around an observe-reason-act loop:

- Observe: ingest market, pricing, and vault state data.
- Reason: rank opportunities using deterministic strategy logic plus AI scoring with fallback behavior.
- Act: execute position management and NAV sync transactions.
- Recover: handle rate limits, API failures, and degraded modes without halting the system.

The system is not a static dashboard. It is an autonomous decision and execution layer.

## What We Built

- Solana Anchor smart contract for custody and share accounting.
- Token-2022 share token minting logic.
- Automated engine (cron-based):
  - market scanner
  - AI scorer
  - NAV calculator
  - position manager
  - yield router
- Next.js frontend:
  - wallet connection
  - vault dashboard
  - portfolio/PnL views
- Jupiter integrations:
  - Prediction API for market coverage and order flows
  - Lend API for idle capital yield routing
- Dune SIM integration for live wallet visibility via SVM endpoint.

## Current Status

- Live devnet deployment: [axiom-vaults.vercel.app](https://axiom-vaults.vercel.app)
- Vault NAV sync operating on-chain for all three vaults.
- Engine loops are active and resilient under API instability.
- Transparent logs and health endpoints available for validation.

## On-Chain Proof (Devnet)

- Vault 1 NAV sync tx:  
  `4fYKmrBS1jhTCxtq4icvrgtwdhcE3rUWKMx95AGPre52bcoFqzdDfBWvqWNr8DfuhMKoawwWT11emgoFVQskw6vs`
- Vault 2 NAV sync tx:  
  `32iUA5mYschTQNjSeC97biSA4YEQbWwqtEcMQzunVwZcSuhabb37KxQDDovnihovM5UKDQKCKJzyXCrdJyz1BRXj`
- Vault 3 NAV sync tx:  
  `5bxL1K7AiktANnypCvPwVhwGRdSQDGBxiof12HLchqiMvCnCxXsgwa8N3XcVK3fiRBuSPNKuoWXDvhzid8gMyKdx`

## Ecosystem / Competition Context

- Colosseum Frontier Hackathon - DeFi Track
- Side bounties:
  - Jupiter Developer Platform
  - Dune SIM
  - RPC Fast
  - 100xDevs

## Why Superteam Should Fund This

This grant directly accelerates production readiness of an agentic DeFi primitive:

- Better scoring and ranking quality
- More robust execution and risk controls
- Multi-venue market support
- Mainnet-safe rollout path
- Transparent operator and user observability

Axiom is not just another interface layer. It is infrastructure for autonomous, user-facing capital allocation in prediction markets.

## Use of Funds

The grant will be used to:

- improve model quality and reliability for market scoring
- harden execution, retry, and failure-handling paths
- extend venue coverage and routing intelligence
- complete mainnet deployment and monitoring
- improve public transparency artifacts and reporting

## Expected Outcomes

By end of grant period:

- Stable mainnet-capable execution mode
- Expanded market coverage
- Better risk controls and clearer execution telemetry
- Demonstrable user beta with measurable activity metrics

## Team Note

We are building with a long-term product mindset: clear user value, verifiable on-chain state updates, resilient automation, and transparency-first operations.

