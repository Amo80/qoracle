# Phase 3 Change Report

## Runtime integration

- `app/layout.tsx` conditionally mounts the shared layer only when the Phase 3 server flag is enabled.
- `components/living-oracle/LivingOracleLayer.tsx` detects the currently rendered Oracle, observes the protected interaction lifecycle, loads only the selected character entry asset, exposes shared return navigation, pauses on hidden documents, and publishes presentation state through document data attributes.
- `app/styles/living-oracle.css` contains shared shell styles, the bounded Jester vertical slice, lightweight effects for the other Oracles, responsive behavior, and reduced-motion alternatives.

## Architecture

- `lib/living-oracle/machine.ts` defines the deterministic presentation reducer and reduced-motion timing policy.
- `lib/living-oracle/manifests.ts` defines versioned asset and capability manifests for all five production Oracle identities.
- `lib/living-oracle/response.ts` defines the AI-ready response envelope and validates semantic presentation cues. Phase 3 creates no AI integration.
- `lib/experience/featureFlags.ts` adds the strict `LIVING_ORACLE_V3_ENABLED` flag.

## Tests and budgets

- Lifecycle, repeated-cycle, stale-transition, hidden-tab, asset-error, reduced-motion, manifest identity, selected-only loading, response validation, feature-flag, accessibility, navigation, and no-AI integration contracts were added.
- The existing exact 155-answer test remains unchanged.
- The existing 43-file Phase 2 protected-production baseline remains unchanged.
- The performance checker now budgets Living Oracle CSS at 24 KiB and a selected character entry asset at 3.5 MiB.

## Intentionally untouched

- `components/OracleQR.tsx`
- `app/oracle/page.tsx`
- `app/q/[code]/page.tsx`
- Answer content and selection
- Stripe, Printify, Supabase, QR ownership/recording, Admin, orders, fulfillment, Tarot, Shop, and Merch
- Phase 2 Chamber behavior and feature flag

No migration is included.
