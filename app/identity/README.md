# Solana Identity Integration

Axiom Vaults implements SNS (Solana Name Service) based identity to create trust and reputation in automated DeFi operations.

## Features

### User Identity
- **.sol Domain Resolution**: Connect wallet and automatically resolve primary .sol domain
- **Identity Badge**: Visual indicator in the topbar showing connected identity
- **Trust Score**: On-chain reputation based on wallet activity and age

### Agent Identity
- **Autonomous Agents**: Vault strategy agents with distinct .sol-based identities
- **Reputation System**: Agents build reputation through successful execution
- **Strategy Attribution**: Track which strategies agents execute

## Implementation

### Core Services
- `snsIdentityService`: Handles domain resolution and identity management
- `useSnsIdentity`: React hook for identity state management
- `fetchSolanaIdentitySnapshot`: Comprehensive identity data fetching

### Components
- `IdentityBadge`: Shows current identity status in navigation
- `AgentIdentityCard`: Displays agent identity with reputation metrics

### SNS Integration
- Uses `@bonfida/spl-name-service` for domain resolution
- Supports both forward (domain → wallet) and reverse (wallet → domain) lookups
- Graceful fallback when domains aren't registered

## Usage

1. Connect wallet with Solana Name Service
2. Register .sol domain at [sns.id](https://www.sns.id)
3. Identity automatically resolves and displays in the app
4. Agent identities are created for vault operations

## Hackathon Relevance

This implementation addresses the SNS Identity Track requirements:

- **Agent Identity**: Autonomous vault agents with on-chain identities
- **Social Identity**: .sol domains as universal login across Solana apps
- **Trust & Reputation**: On-chain reputation system for DeFi operations
- **Sybil Resistance**: Identity-based access control for vault participation</content>
<parameter name="filePath">/home/mysterioxplorer/Axiom/app/identity/README.md