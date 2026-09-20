# Phase 4A Preview Pass #1 correction

## Scope

This correction changes only the feature-flagged 3D Jester presentation. It does not change the protected Oracle engine, answer selection/timing, `OracleQR.tsx`, non-Jester Oracles, commerce, backend behavior, or Production configuration.

## Refinements

- Suppressed the inherited `.shaking` container animation only when the Jester 3D renderer has completed its ready handoff. Loading, fallback, reduced-motion, feature-disabled, and Phase 3 static paths retain their existing behavior.
- Reduced the independent crystal ball scale from `0.24` to `0.12` and moved its base position from `(0, 0.54, 0.48)` to `(0, 0.92, 0.42)`. Its independent group, rotation, and float controls remain intact.
- Confirmed the lifecycle reaches `reacting` for 650 ms and the optimized `Big_Heart_Gesture` clip is present with a 6.25-second source duration.
- Prefetches the 90,980-byte Heart animation during `speaking`, preventing first-load latency from consuming the short reaction window.
- During `reacting`, the real Heart clip begins at 0.75 seconds and plays at `3x`, exposing its readable gesture development before the existing lifecycle advances. Incoming lifecycle commands still interrupt/crossfade immediately; animation duration never controls Oracle timing.
- Jazz remains disabled. Camera, lighting, Jester scale, Idle, and Talk mappings are unchanged.

## Changed files relative to Preview Pass #1

- `app/styles/living-oracle.css`
- `components/living-oracle/jester/Jester3DStage.tsx`
- `lib/living-oracle/jester3d.ts`
- `lib/living-oracle/jester3d.test.ts`
- `lib/living-oracle/jester3d-integration.test.ts`
- `docs/phase4a/PREVIEW-PASS-1-CORRECTION.md`

## Verification

- Targeted lifecycle/Jester tests: 19 passed.
- Complete test suite: 85 passed across 19 files.
- TypeScript: passed.
- ESLint: 0 errors; 26 unchanged baseline warnings.
- Performance budgets: passed, including 6.74 MiB initial Jester transfer.
- Feature-enabled production build: passed.
- `components/OracleQR.tsx` SHA-256 remains `8b88a2a9c26e32e9c304eb5195da5cb815372831fbd1f1988db1e37b722c1dbb`, identical to the Phase 4A starting snapshot.

Manual Preview approval remains required for the new ball composition and accelerated Heart presentation.
