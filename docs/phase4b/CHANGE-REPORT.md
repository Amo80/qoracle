# Phase 4B Change Report — Pre-commit Preview Gate

Phase 4B adds a disabled-by-default, presentation-only 3D Love Oracle vertical slice. It preserves the Phase 3 lifecycle and `OracleQR.tsx` as the authority for questions, answers, and timing.

## Runtime integration

- Added strict `LOVE_3D_V4B_ENABLED`; it requires Phase 3, full-motion eligibility, and WebGL support.
- Added a client-only lazy Love stage. Three.js remains absent from the layout and homepage server path.
- Kept the character, heart crystal, and podium as independent scene groups.
- Runs `Idle_7` continuously and adds temporary post-mixer quaternion offsets only to Spine2, Neck, Head, Left/Right Arm, and Left/Right ForeArm.
- Restores every controlled quaternion immediately after each render, preventing cumulative drift across frames or repeated question cycles.
- Added lifecycle-specific heart float, pulse, rotation, and emissive behavior; the podium receives only restrained emissive presentation.
- Preserved the canonical Love PNG during loading and for feature-off, reduced-motion, WebGL failure, asset failure, and rollback paths.
- Packaged `Shrug` and `Bubble_Dance` separately with `approved: false`; Walking, Running, and restpose are excluded.

## Asset preparation

| Runtime asset | Bytes | MiB | Geometry |
|---|---:|---:|---:|
| Love character + `Idle_7` | 5,355,112 | 5.11 | 29,464 triangles; unchanged |
| Heart crystal | 2,893,484 | 2.76 | 60,888 triangles |
| Podium | 3,537,832 | 3.37 | 77,130 triangles |
| Initial transfer | 11,786,428 | 11.24 | Target met |

Character textures are capped at 2048px WebP quality 88 and geometry is retained. The heart and podium use conservative simplification with a 0.001 error threshold and quantization. Source GLBs remain outside deployable `public`.

## Files changed or added

- `.env.example`
- `app/layout.tsx`
- `app/styles/living-oracle.css`
- `components/living-oracle/LivingOracleLayer.tsx`
- `components/living-oracle/love/Love3DErrorBoundary.tsx`
- `components/living-oracle/love/Love3DStage.tsx`
- `lib/experience/featureFlags.ts` and its test
- `lib/living-oracle/love3d.ts` and three focused test files
- `scripts/prepare-love-3d.mjs`
- `scripts/check-performance.mjs`
- `package.json` (asset-preparation command only)
- `public/characters/love/v1/**`
- Phase 4B review documentation

No dependency was added. The existing Three.js and glTF Transform toolchain is reused. The approved Jester stage, assets, camera, lighting, animation mappings, ball behavior, and CSS rules were not edited.

## Protected systems

The protected backend/commerce diff is empty. `components/OracleQR.tsx` remains byte-identical at SHA-256 `8b88a2a9c26e32e9c304eb5195da5cb815372831fbd1f1988db1e37b722c1dbb`. No answer, QR, Stripe, Printify, Supabase, order, admin, analytics, fulfillment, Tarot, Shop, Merch, or non-Love Oracle implementation changed.

## Review limitations

- Final character framing, prop scale/placement, lighting, and procedural gesture readability require desktop and mobile Preview approval.
- The current rig has no supported facial controls; Phase 4B intentionally adds none.
- GPU texture allocation can be materially larger than compressed transfer size. Preview should include a representative lower-end mobile device.
- The asset pipeline reports geometric/error constraints but cannot replace visual review of rose, jewelry, filigree, and silhouette retention.
