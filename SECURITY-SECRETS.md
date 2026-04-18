# Secret keys and API credentials

This project talks to paid or rate-limited APIs (Jupiter, Dune SIM, RPC) and may sign Solana transactions from a local keypair. Treat every credential as **compromised if it ever appeared in a public repo, screenshot, chat, or client bundle**.

## What must stay private

- **Solana keypair JSON** (`~/.config/solana/id.json`, `keypair.json`, `VAULT_AUTHORITY_KEYPAIR_PATH`, engine authority paths). These control funds and program upgrades.
- **`JUPITER_API_KEY`**, **`DUNE_SIM_API_KEY`**, **`AI_API_KEY`**, RPC URLs that embed secrets, and any third-party tokens.

## What is public by design (Next.js)

Any variable prefixed with **`NEXT_PUBLIC_`** is embedded in the browser bundle. **Anyone** can open devtools → sources / network and read it.

- If you put **`NEXT_PUBLIC_JUPITER_API_KEY`** or **`NEXT_PUBLIC_DUNE_SIM_API_KEY`** in `.env.local`, you are intentionally exposing those keys to every visitor.
- For a public site, prefer:
  - **Server-only** env vars (no `NEXT_PUBLIC_` prefix) and **Next.js Route Handlers** (`app/api/...`) that proxy requests to Jupiter/Dune, **or**
  - Separate **read-scoped** / **low-quota** keys only if the provider allows safe client exposure.

## Repository hygiene

- Only **`.env.example`** should describe variable names; values must be placeholders.
- Real values live in **`.env.local`** (frontend) and **`engine/.env`** (backend) on your machine only. Both are listed in `.gitignore`.
- If you ever **committed** a real key, assume it is leaked: **rotate** the key at the provider, then remove it from git history (`git filter-repo` / BFG) if it was pushed.

## Engine / vault signer

- The strategy engine loads the authority keypair from disk (`KEYPAIR_PATH` / config). That file must **never** be in the repo.
- For production, use a **hardware wallet**, **multisig**, or **custodial signer** with minimal privileges—not a hot file on a laptop.

## Quick checklist

1. Copy `.env.example` → `.env.local` / `engine/.env`; fill with real values **locally only**.
2. Remove or avoid `NEXT_PUBLIC_*` for any key you would not post on Twitter.
3. Rotate any key that was shared or committed by mistake.
4. Never log `process.env.*` or full request headers in production code.

On-chain program security notes live under `programs/spectra-vault/SECURITY.md`.
