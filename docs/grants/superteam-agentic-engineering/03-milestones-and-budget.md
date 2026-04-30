# Milestones and Budget

## Requested Grant

USD 25,000 (adjust as needed in final form)

## Timeline

8 weeks

## Milestone 1 (Weeks 1-2): Scoring and Agent Reliability

Deliverables:

- AI pipeline throttling and queue stabilization
- model fallback policy (AI -> cached/rules)
- prompt/token optimization with measurable reduction
- improved scoring telemetry and error traces

Success metrics:

- >90% scanner loop completion without hard failure
- reduced AI token/request footprint per scan cycle

Budget allocation: $6,000

## Milestone 2 (Weeks 3-5): Execution and Risk Hardening

Deliverables:

- execution mode controls (paper/live)
- stronger order validation and request pacing
- robust retry/backoff with provider hints (retry-after)
- clearer trade outcome classification

Success metrics:

- deterministic behavior under 400/429 failures
- full decision trail for each attempted trade

Budget allocation: $8,000

## Milestone 3 (Weeks 6-7): Mainnet Readiness

Deliverables:

- mainnet configuration profile and safety guardrails
- on-chain verification + vault state checks
- expanded strategy controls for capital protection

Success metrics:

- successful end-to-end mainnet dry run checklist
- successful first controlled live execution cycle

Budget allocation: $7,000

## Milestone 4 (Week 8): Beta Ops and Reporting

Deliverables:

- public-facing transparency/reporting artifacts
- beta instrumentation and usage metrics
- final grant report with links, tx proofs, and metrics

Success metrics:

- active beta users and observable vault activity
- complete reproducible report package

Budget allocation: $4,000

## Total Budget Split

- 24% scoring + intelligence reliability
- 32% execution/risk systems
- 28% mainnet enablement
- 16% beta reporting + operations

