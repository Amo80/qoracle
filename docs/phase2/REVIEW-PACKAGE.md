# The QRystal Balls 2.0 — Phase 2 Review Package

## Review status

Phase 2 — Cinematic Entrance and Oracle Chamber Shell is complete for review. It has not been merged to `main`, deployed, connected to production mutations, or extended into Phase 3.

Authoritative source snapshot: `qrystal-balls-phase2-start.zip`  
Starting checkpoint recorded by the archive: `3deba3108e5444a8ae4fb62855a5f64a9e9c267e`

## Delivered scope

- A cinematic entrance implementing the `ENTER → CHOOSE AN ORACLE` portion of the approved journey.
- A shared chamber selector for Jester, Chaos, Love, Eclipse, and Dragon.
- A typed, presentation-only chamber state machine with entrance, selection, focus, and handoff states.
- Existing-route handoff to `/oracle?theme=…`; no Oracle interior or `ASK → AWAKEN → REVEAL` behavior was rebuilt.
- A server-side `ORACLE_CHAMBER_V2_ENABLED` feature flag that is disabled unless its value is explicitly `true`.
- A `/?classic=1` bypass that keeps the Phase 1 homepage available while the flag is enabled.
- Keyboard-operable semantic controls, focus transfer, Escape-to-reconsider behavior, live status messaging, and informative accessible names.
- Immediate route handoff for reduced motion plus CSS system/user reduced-motion fallbacks.
- Mobile-first styling using existing Oracle assets and no new media payloads.

## Feature-flag behavior

| Environment value | `/` result |
| --- | --- |
| Missing | Phase 1 homepage |
| Empty | Phase 1 homepage |
| `false` | Phase 1 homepage |
| Unexpected value such as `1` | Phase 1 homepage |
| `true` (case-insensitive) | Phase 2 entrance/chamber |

When enabled, `/?classic=1` still renders the byte-identical Phase 1 homepage. Disabling the flag restores the Phase 1 homepage without a database change.

## Protected functionality

The automated protected-baseline test covers 43 existing source files and confirms no changes to:

- Stripe Checkout, verification, webhook, metadata, and order mapping
- Printify products, shipping, fulfillment, submission, and status sync
- Supabase clients, schema, migrations, audit material, and QR storage paths
- `/q/[code]` lookup, active-state handling, and scan recording
- Admin authentication, analytics, products, orders, packing, tracking, and shipping email
- Shop, Merch, Checkout, Success, and Tarot behavior
- `OracleQR` and existing Oracle question, answer, awakening, and reveal behavior
- All 155 protected Oracle answers, counts, content, and ordering

The Phase 1 homepage was moved to `components/home/LegacyHome.tsx` without content changes; it is byte-identical to the starting `app/page.tsx`.

## Verification summary

| Check | Result |
| --- | --- |
| ESLint | Passed with 0 errors; the same 26 existing warnings remain |
| TypeScript | Passed |
| Tests | 39/39 passed across 9 files |
| Protected production baseline | Passed; 43 files match the Phase 2 starting hash |
| Oracle answer protection | Passed; 155 answers unchanged |
| Performance budgets | Passed |
| Production build | Passed; all 27 routes retained |
| Feature flag off HTTP smoke | 10/10 routes returned HTTP 200 |
| Feature flag on HTTP smoke | 10/10 routes returned HTTP 200 |
| Flag content assertions | Passed for fallback, chamber, and classic bypass |

## Reviewer focus

- Verify the flag is absent or `false` in production during review.
- Enable it only on a Vercel Preview and follow `PREVIEW-CHECKLIST.md`.
- Review entrance pacing, chamber selection clarity, and mobile fit.
- Confirm all five selections enter their existing Oracle experiences.
- Confirm no global Sound/Motion controls appear.
- Confirm direct QR, Oracle, Shop, Merch, Tarot, and Admin URLs bypass the entrance normally.

## Approval boundary

Approval authorizes Phase 2 review/merge handling only. It does not authorize production deployment, individual Oracle redesigns, QR summoning, Tarot chamber work, new audio, or Phase 3.
