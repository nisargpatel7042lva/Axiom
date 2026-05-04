# Supabase checklist

## Setup
- [ ] Create Supabase project
- [ ] Verify project URL and publishable key
- [ ] Add env vars to deployment platform

## Local env
- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- [ ] Ensure env vars are loaded in dev and prod

## Client integration
- [x] Add Supabase client helper
- [x] Add typed helpers for portfolio history storage
- [x] Add server/client boundary notes

Notes:
- Client uses `NEXT_PUBLIC_SUPABASE_*` and only reads/writes portfolio metric history.
- No auth/session persistence; data is keyed by wallet address.

## Portfolio history storage
- [x] Define table for portfolio history
- [x] Implement read path (fetch history)
- [x] Implement write path (append history)
- [x] Backfill localStorage data (optional)
- [x] Remove localStorage fallback (optional)

Schema (SQL):
```
create table if not exists portfolio_metric_history (
	wallet text not null,
	t bigint not null,
	value double precision not null,
	date text not null,
	inserted_at timestamptz not null default now(),
	primary key (wallet, t)
);

create index if not exists portfolio_metric_history_wallet_t
	on portfolio_metric_history (wallet, t desc);
```

## Verification
- [ ] Local dev shows same graph after refresh
- [ ] Deployed dev shows same graph as local
- [ ] Error handling for missing Supabase data
