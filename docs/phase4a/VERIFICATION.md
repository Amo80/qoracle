# Phase 4A Verification — Pre-Commit

## Automated checks

- ESLint: passed with zero errors and the same 26 pre-existing warnings.
- TypeScript: passed.
- Vitest: 81/81 tests across 19 files passed.
- Protected answer total and exact content/order: passed at 155 answers.
- Phase 2 protected-production 43-file digest: passed.
- Canonical `jester-oracle.png` hash protection: passed.
- Performance budgets: all passed.
- Production build with Phase 4A disabled: passed with sanitized placeholder build variables.
- Production build with Living Oracle and Phase 4A enabled: passed with sanitized placeholder build variables.
- Route generation: 27 routes.
- Local HTTP smoke with both flags enabled: homepage, Jester, Chaos, Shop, Merch, and Tarot returned 200; Admin correctly redirected with 307 while unauthenticated.
- Versioned base, ball, talk, and fallback assets returned 200.
- Homepage HTML did not reference the 634,703-byte Three.js dynamic chunk.
- Asset preparation was run twice and produced identical SHA-256 output hashes.

## Performance measurements

| Budget | Actual | Limit | Result |
| --- | ---: | ---: | --- |
| Jester base | 5.06 MiB | 8 MiB | Pass |
| Animation-only clips | 0.19 MiB | 2 MiB | Pass |
| Independent ball | 1.68 MiB | 3 MiB | Pass |
| Initial base plus ball | 6.74 MiB | 12 MiB | Pass |
| Three.js lazy chunk | 0.61 MiB | Lazy-only requirement | Pass |
| Total public assets | 142.97 MiB | 145 MiB | Pass, narrow margin |

## Environment note

The first build attempt without environment values stopped during existing Admin prerendering because the sanitized archive contains blank Supabase variables. This was not a Phase 4A compilation failure. Both flag configurations built successfully when non-secret placeholders were supplied.

## Manual approval still required

Automated verification cannot establish camera framing, character scale, ball placement, lighting, material fidelity, animation appeal, mobile GPU smoothness, or whether the supplied Heart performance is appropriate for every current reaction. These remain mandatory Preview checks before a final commit or merge.
