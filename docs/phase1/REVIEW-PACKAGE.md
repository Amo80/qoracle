# The QRystal Balls 2.0 — Phase 1 Review Package

## Review status

Phase 1 is implemented for review only. It has not been merged to `main`, deployed, or extended into Phase 2 cinematic work.

This corrected review release closes the three Phase 1 acceptance gaps identified during review: preference initialization coverage, exact Oracle-answer protection, and visual neutrality of experience controls.

Authoritative source snapshot: `qrystal-balls-phase1-start.zip`  
Snapshot commit recorded by the archive: `894913537249d7634a47a7c51df7bbf6db6a8c71`  
Rollback checkpoint retained by the project owner: `phase0-tested-d88b1ae`

## Phase 1 outcomes

- Added a typed, centralized five-Oracle registry while retaining `dnd` as the production Dragon identifier.
- Preserved legacy `Classic` links and added safe `Dragon` alias normalization at Oracle-entry boundaries.
- Replaced duplicated public Oracle-card definitions on Home and Shop with the registry.
- Added design tokens and reusable button, surface, and visually-hidden primitives without restyling existing screens.
- Kept the 12,447-line legacy stylesheet intact to avoid cascade regressions; new foundation concerns are split into focused files.
- Added non-visual persistent sound/motion preference infrastructure, system reduced-motion support, and a global focus-visible treatment. Visible controls remain deferred and are not rendered in Phase 1.
- Added initialization regression tests that prevent stored preferences from being overwritten by initial defaults.
- Added exact count/content regression protection for all 155 existing Oracle answers.
- Added root, global, and not-found recovery experiences plus secret-filtering diagnostic helpers.
- Added enforceable asset/CSS budgets and incorporated lint, typecheck, tests, budgets, and production build into `npm run check`.

## Protected functionality

No Phase 1 changes were made to:

- Stripe Checkout or webhook routes
- Printify product, fulfillment, order-status, or shipping routes
- Supabase clients, schemas, migrations, or RLS material
- `/q/[code]` lookup, active-state validation, or scan recording
- Admin authentication, orders, analytics, product management, or tracking
- Artifact product IDs, Printify IDs, prices, Stripe metadata, or order mapping
- Existing route names and product URLs
- Tarot card selection logic or content

The only Oracle runtime behavior change is defensive normalization of unsupported Oracle query values to Jester and support for `dragon` as an alias of the existing `dnd` theme. Existing valid theme URLs behave as before.

## Verification evidence

| Check | Result |
| --- | --- |
| ESLint | Passed with 0 errors; 26 pre-existing warnings remain |
| TypeScript | Passed (`tsc --noEmit`) |
| Unit/contract tests | 26/26 passed across 5 files |
| Oracle compatibility tests | 5/5 passed |
| Oracle answer protection | 6/6 passed; 155 answers and per-theme hashes preserved |
| Preference initialization | 6/6 passed, including read-before-write behavior |
| Performance budgets | Passed |
| Production build | Passed with Next.js 16.3.3 |
| Route manifest | 27 pages generated; protected API/dynamic routes retained |
| Local HTTP smoke | 9/9 routes returned HTTP 200 |
| Diff whitespace check | Passed |

The sanitized archive has blank Supabase values. Build verification therefore used local, non-secret placeholder values for the two public Supabase variables. No values were written to source. Connected Stripe, Printify, Supabase, email, and live QR transactions were intentionally not executed from this review workspace.

## Smoke routes

- `/`
- `/oracle?theme=classic`
- `/oracle?theme=dragon`
- `/shop`
- `/merch`
- `/tarot`
- `/admin/login`
- `/checkout`
- `/success`

## Performance guardrails

| Budget | Current | Limit |
| --- | ---: | ---: |
| Public assets | 136.03 MiB | 145 MiB |
| Largest single asset | 9.86 MiB | 11 MiB |
| Legacy global CSS | 236.8 KiB | 500 KiB |

These are regression ceilings for Phase 1, not final performance targets. Existing oversized audio, Tarot imagery, and legacy CSS remain optimization work for an approved later phase.

## Reviewer checklist

- Confirm all five Home and Shop Oracle entries retain their current order, copy, artwork, and destinations.
- Confirm `?theme=classic` opens Jester and `?theme=dragon` opens the existing Dragon/D&D experience.
- Confirm no global Sound/Motion controls are visible in the rendered Phase 1 experience.
- Inspect the root element after preference initialization and confirm the `data-motion` and `data-audio` hooks remain available for future controls.
- Trigger a review-only component error if desired and confirm recovery offers retry/home without exposing details.
- Run the connected-service preview checklist in `docs/phase1/VERIFICATION.md` before any future merge.

## Approval boundary

Approval of this package authorizes review/merge handling for Phase 1 only. It does not authorize a production deployment or any Phase 2 chamber, entrance, transition, or cinematic redesign work.
