# Veridian Planner, Phase 1

Multi-user planner for Veridian Revenue Partners: retainer clients, scheduling
calendar, capacity, overage, 12-month forecast, client statements, expenses,
what-if scenarios, billing export and contract generation. Built from
Veridian_Planner_Build_Spec v2.0 with the Veridian Retainer Model spreadsheet
as the numerical reference (the spec wins where they differ).

## What is in this pack

- `core/` — the pure TypeScript domain engine: packages, capacity, terms,
  booking states, overage, alerts, forecast, statements, what-if, expenses.
  No dependencies, no I/O; safe to drop into any app.
- `tests/` — 60 vitest checks pinning the engine to the spreadsheet's 27
  verified scenarios (T01–T27) and the spec's additional pure-logic tests.
- `prisma/schema.prisma` — the full Phase 1 data model (spec section 21).
- `app/tokens.css` — brand tokens (spec section 20.3 working values).
- `REPLIT-BUILD-BRIEF.md` — the staged brief for building the application
  around this engine on Replit (app.veridian-partners.com).

## Run the tests

```
npm install
npm test        # 60 tests
npm run typecheck
```
