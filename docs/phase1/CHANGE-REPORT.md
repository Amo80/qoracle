# Phase 1 Change Report

## Correction pass

- Prevented initial default preferences from overwriting an existing stored audio or motion choice.
- Added six preference tests covering stored choices, system reduced-motion fallback, missing/malformed/inaccessible storage, and read-before-write initialization.
- Moved the unchanged Oracle answer arrays into a typed data module and added six tests protecting all 155 answers by count and per-theme content/order hash.
- Removed `ExperienceControls` and its stylesheet from the rendered root layout while retaining the provider, document hooks, and future control component.

## Added

- `lib/oracles/registry.ts` — typed Oracle IDs, metadata, URL definitions, and legacy alias normalization.
- `lib/oracles/registry.test.ts` — production identifier, ordering, asset, URL, alias, and fallback contracts.
- `app/styles/tokens.css` — semantic color, spacing, radius, timing, and focus tokens.
- `app/styles/primitives.css` and `components/ui/*` — reusable foundation primitives.
- `app/styles/accessibility.css` — focus-visible and reduced-motion safeguards.
- `components/experience/*`, `lib/experience/preferences.ts`, and preference tests — persisted sound/motion infrastructure with read-before-write initialization. The future control component remains available but is not rendered or globally styled in Phase 1.
- `lib/oracles/answers.ts` and `answers.test.ts` — unchanged production answer libraries plus exact count/content hash protection.
- `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, and supporting fallback styles/components.
- `lib/observability/logger.ts` — minimal structured diagnostics with sensitive-key filtering.
- `scripts/check-performance.mjs` — public asset, largest-asset, and legacy-CSS regression budgets.
- Phase 1 review and verification documentation.

## Refactored without intended visual change

- `app/page.tsx` now renders its five Oracle cards from the registry.
- `app/shop/page.tsx` now renders its Oracle selector from the same registry.
- `app/oracle/page.tsx` and `components/OracleQR.tsx` share boundary normalization.
- `app/layout.tsx` loads the split foundation styles and preference provider.
- `app/layout.tsx` no longer renders visible experience controls; Phase 1 remains visually neutral.
- `package.json` exposes `typecheck`, `perf:budget`, and a complete `check` pipeline.

## Explicitly unchanged

All API routes, QR database behavior, commerce/order code, Supabase code, admin code, Tarot behavior, fulfillment behavior, IDs, prices, and migrations are unchanged.

## Deferred

- Cinematic entrance and Oracle Chamber presentation
- Oracle transitions, awakening sequences, and reveal redesigns
- Audio redesign or new sound assets
- Tarot chamber redesign
- Large-asset conversion/compression
- Legacy Oracle CSS decomposition beyond the new foundation modules
- Lore, discoveries, collectibles, achievements, and seasonal systems
