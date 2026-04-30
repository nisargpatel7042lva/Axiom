# Demo Script (3-5 Minutes)

## 0:00 - 0:30 Intro

"Axiom is a prediction market ETF on Solana. Users deposit USDC into strategy vaults, and our engine handles scanning, scoring, allocation, and NAV updates automatically."

## 0:30 - 1:20 Product Walkthrough

- Open app homepage
- Connect wallet
- Show three vaults and strategy differences
- Show deposit/portfolio flow

## 1:20 - 2:20 Agentic Engine Walkthrough

- Show engine logs:
  - market scan start
  - opportunities scored
  - NAV sync transaction
  - position manager actions
- Explain fallback behavior (rate limits/API failures do not halt engine)

## 2:20 - 3:10 On-Chain Proof

- Open Solana Explorer devnet links for vault 1, 2, 3 NAV sync transactions
- Highlight that vault state is being updated on-chain

## 3:10 - 4:10 Architecture and Infra

- Briefly show architecture diagram:
  - Next.js frontend
  - Anchor program
  - Engine services (scanner/scorer/NAV/positions/yield)
  - Jupiter + Dune integrations

## 4:10 - 5:00 Grant Ask and Roadmap

"With Superteam support, we will harden execution for scale, improve scoring quality, support more venues, and complete mainnet rollout with transparent operator reporting."

## Recording Checklist

- terminal zoom readable
- no sensitive env vars visible
- include at least one health endpoint response
- include all 3 tx proof links

