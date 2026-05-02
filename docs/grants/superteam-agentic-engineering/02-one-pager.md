# Axiom - One Pager

## What is Axiom?

Axiom is a prediction market ETF on Solana. Users deposit USDC into strategy vaults, and an automated engine manages position discovery, allocation, and vault accounting.

## User Experience

1. Connect wallet
2. Choose a vault strategy
3. Deposit USDC
4. Engine handles opportunity scanning and portfolio management
5. User can withdraw based on vault share value

## Core Vault Strategies

- Safe Consensus
- Macro Contrarian
- Yield Maximizer

## Agentic Engine Loop

- Scan live prediction markets
- Score and rank opportunities
- Select and size candidate positions
- Sync NAV/PPS on-chain
- Route idle capital to Jupiter Lend
- Recover gracefully on API/rate-limit failures

## Why It Matters

Prediction markets are high signal but hard to manage manually. Axiom productizes access through structured vaults and autonomous execution.

## Tech Stack

- Solana + Anchor
- Token-2022
- Next.js frontend
- Jupiter Prediction + Jupiter Lend APIs
- Dune SIM data integration

## Current Evidence

- Devnet app live
- Repeated on-chain NAV sync proofs across 3 vaults
- Operational engine with fallback and retry behavior

## Grant Purpose

Use grant support to transition from hackathon-grade automation to production-grade agentic infrastructure:

- scoring quality improvements
- stronger execution resilience
- multi-venue support
- mainnet rollout and monitoring

