# Phase 2 Detailed Change Report

## Added

- `lib/experience/featureFlags.ts` — strict disabled-by-default chamber flag and classic-bypass decision helper.
- `lib/experience/featureFlags.test.ts` — missing, false, unexpected, true, case-insensitive, and bypass contracts.
- `lib/chamber/machine.ts` — presentation-only chamber state reducer and reduced-motion handoff timing.
- `lib/chamber/machine.test.ts` — state transition, selection, activation guard, back, and motion tests.
- `components/chamber/OracleChamber.tsx` — entrance, chamber selection, transition shell, routing handoff, focus management, and alternative destinations.
- `components/chamber/OracleChoice.tsx` — semantic, keyboard-native Oracle selector using the Phase 1 registry.
- `components/chamber/OracleChoice.test.tsx` — server-rendered accessibility markup contracts.
- `app/styles/chamber.css` — isolated mobile-first chamber presentation, Oracle accents, bounded CSS motion, and reduced-motion fallbacks.
- `lib/protection/phase2Baseline.test.ts` — aggregate SHA-256 baseline for 43 protected production files.
- Phase 2 review, change, verification, and Preview documentation.

## Changed

- `app/page.tsx` is now a server decision boundary. It renders the Phase 2 chamber only when the feature flag is explicitly enabled and the classic bypass is not requested.
- The previous `app/page.tsx` moved unchanged to `components/home/LegacyHome.tsx` for the fallback.
- `app/layout.tsx` imports the isolated chamber stylesheet.
- `.env.example` documents `ORACLE_CHAMBER_V2_ENABLED=false` by name and safe default.

## Runtime sequence

1. The server evaluates the feature flag.
2. Disabled/default: render the unchanged Phase 1 homepage.
3. Enabled: render the cinematic entrance.
4. The visitor enters the shared chamber and selects one registered Oracle.
5. The state machine prevents handoff until an Oracle is selected.
6. Full motion uses a bounded 720 ms transition; reduced motion uses 0 ms.
7. Next.js routes to the existing Oracle URL.

## Explicitly unchanged

All protected API, QR, admin, commerce, fulfillment, Supabase, Tarot, Shop/Merch, answer-library, and `OracleQR` files are unchanged. No database migrations or new public media assets were added.

## Deferred

- Individual Oracle chamber/interior conversion
- New awakening and reveal sequences
- QR artifact summoning presentation
- Tarot chamber integration
- New audio identities or visible sound/motion controls
- Lore, discoveries, collectibles, achievements, and seasonal systems
- Production rollout
