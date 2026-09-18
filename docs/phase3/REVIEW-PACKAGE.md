# Phase 3 — Living Oracle Foundation Review Package

## Review boundary

Phase 3 adds a feature-flagged, presentation-only Living Oracle layer around the existing Oracle engine. It does not modify `OracleQR`, either Oracle route, the 155 protected answers, QR scan recording, or any protected production system.

Enable only in a Preview environment with:

```text
LIVING_ORACLE_V3_ENABLED=true
```

The flag is strict and disabled by default. Phase 2's independent Chamber flag remains unchanged.

## Delivered

- A reusable shared Living Oracle shell detected on both `/oracle` and `/q/[code]` experiences.
- One consistent, keyboard-accessible Return to Homepage control for all five Oracles.
- Dragon's one-off back control is visually superseded only while Phase 3 is enabled; its protected implementation is untouched.
- A presentation-only lifecycle: `idle → listening → awakening → anticipating → speaking → reacting → returning → idle`.
- Cycle tokens that reject stale delayed transitions and support repeated questions.
- Hidden-tab pause/resume and asset-error fallback states.
- Selected-Oracle-only character manifests preserving `dnd` as Dragon's production identity.
- Jester reference animations using its existing composite artwork.
- Lightweight lifecycle presentation for Chaos, Love, Eclipse, and Dragon without final rigs.
- Stored and system reduced-motion fallbacks.
- An AI-ready normalized response/presentation contract using bounded semantic cues.
- No AI provider, request, generated answer, prompt, credential, or network call.
- Character-entry asset and Phase 3 CSS performance budgets.

## Engine boundary

The shared layer observes existing DOM lifecycle signals. It never selects an answer, changes the protected delay, blocks a reveal, records a scan, or owns Oracle state. If the Phase 3 layer fails or is disabled, the existing Oracle remains usable.

## Review priorities

1. Test flag OFF before flag ON.
2. Test all five direct Oracle URLs.
3. Test at least one active QR code for each available production theme.
4. Confirm every Oracle has the shared Return to Homepage control.
5. Exercise two consecutive question cycles per Oracle.
6. Confirm Jester's seven presentation states feel expressive but do not interfere with input or answers.
7. Confirm the other four remain intentionally lightweight.
8. Verify reduced motion and keyboard navigation.
9. Verify mobile layout and orientation changes.

Phase 4 character production and Phase 5 Oracle Intelligence are explicitly outside this package.

## Verification summary

- 60/60 tests passed across 14 files.
- The 155 protected answers and their exact content/order passed.
- The 43-file protected-production baseline passed.
- Protected backend/commerce diff is empty.
- Lint completed with 0 errors and 26 pre-existing warnings.
- TypeScript, performance budgets, and flag-OFF/flag-ON production builds passed.
- HTTP smoke returned 200 for 10/10 reviewed routes with each flag setting.
