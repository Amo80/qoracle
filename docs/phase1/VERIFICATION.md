# Phase 1 Verification

## Automated suite

With the normal development environment configured:

```bash
npm ci
npm run check
```

The `check` script runs lint, TypeScript, unit/contract tests, performance budgets, and the production build in that order.

The automated suite also verifies:

- stored audio and motion choices;
- system reduced-motion fallback;
- missing, malformed, invalid, and inaccessible local storage;
- read-before-write initialization so defaults cannot overwrite an existing choice;
- exact counts, content, and order for all five production Oracle answer libraries.

## Corrected review results

- ESLint: passed with 0 errors (26 existing warnings).
- TypeScript: passed.
- Tests: 26/26 passed across 5 files.
- Performance budgets: passed.
- Production build: passed; 27 routes retained.
- Local route smoke: 9/9 returned HTTP 200.
- Protected backend/commerce diff: empty.

## Connected-service preview checklist

Run this on a Vercel Preview with test-mode/service credentials. Do not point it at production mutations during review.

- Open one active existing `/q/[code]`; confirm its stored Oracle appears and one scan is recorded.
- Open one inactive code; confirm the inactive artifact screen appears.
- Complete one Stripe test artifact checkout and confirm one order is created.
- Complete one Stripe test merch checkout and confirm the selected Printify IDs/variant remain correct.
- Reload `/success`; confirm no duplicate order is created.
- Open Admin, Orders, an order detail, Products, and Analytics as the configured admin.
- Confirm manual Printify submission and status sync remain guarded exactly as in Phase 0.
- Confirm tracking and shipping email controls render without changing order state until explicitly submitted.

## Rollback

Phase 1 has no database migration. If review uncovers a regression, discard/revert the Phase 1 commit(s) and return the branch to its authoritative starting commit. Production remains on `main`; `phase0-tested-d88b1ae` remains the Phase 0 rollback checkpoint.
