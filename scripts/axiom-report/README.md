# Axiom Report Scripts

Pipeline:

1. Fetch program transactions into JSONL
2. Analyze instruction/error/wallet stats
3. Build UI-ready summary report

## Environment

Set these vars before running:

- `AXIOM_PROGRAM_ID` (required)
- `AXIOM_RPC_URL` (required)
- `AXIOM_IDL_PATH` (optional, default `./scripts/axiom-report/axiom_program.json`)
- `AXIOM_EXCLUDED_WALLETS` (optional, comma-separated list)

## Commands

From repo root:

```bash
npm run axiom:fetch
npm run axiom:analyze
npm run axiom:report
```

Or run all in sequence:

```bash
npm run axiom:pipeline
```

Outputs are written to:

- `scripts/axiom-report/data/transactions.jsonl`
- `scripts/axiom-report/data/analysis.json`
- `scripts/axiom-report/data/report.json`

