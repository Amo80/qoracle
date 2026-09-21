# Phase 4B Verification — Pre-commit

## Automated results

- ESLint: passed with 0 errors and 26 pre-existing warnings.
- TypeScript: passed (`tsc --noEmit`).
- Vitest: 22 files, 97 tests passed.
- Protected answers: existing exact 155-answer counts/content/order tests passed.
- Performance budgets: passed; Love initial transfer is 11.24 MiB and total public assets are 154.35 MiB.
- Production build, flags OFF: passed with non-secret sanitized Supabase placeholders.
- Production build, Phase 3 + Jester + Love flags ON: passed with the same placeholders.

The first build attempt without placeholders stopped in existing Admin prerendering because the sanitized archive has blank public Supabase values. It compiled and typechecked before that stop. No credential was written to source.

## Regression boundaries

- Phase 4A Jester tests passed unchanged.
- Canonical Jester fallback hash test passed.
- Love feature-off, reduced-motion, unsupported-WebGL, and asset-error branches preserve the static Oracle path.
- Love renderer contains no answer selection, timers, or lifecycle completion events.
- Character, heart, and podium teardown disposes renderer, geometry, materials, and textures.
- Raw Love source exports are not in deployable `public`.
- Protected production source and backend/commerce diff: empty.

## Preview-only configuration

Set these values only in Vercel's Preview environment, then redeploy the Phase 4B review branch:

```text
LIVING_ORACLE_V3_ENABLED=true
JESTER_3D_V4A_ENABLED=true
LOVE_3D_V4B_ENABLED=true
```

Do not change Production values. Direct review URL after deployment: `/oracle?theme=love`.
