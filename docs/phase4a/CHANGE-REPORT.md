# Phase 4A Change Report — Pre-Commit Review

## Result

Phase 4A adds a separately gated, client-only Three.js Jester presentation around the unchanged Oracle engine. The existing static Jester remains the loading poster, reduced-motion presentation, failure fallback, flag-off presentation, and rollback asset.

No final Phase 4A commit has been created.

## Runtime architecture

- Adds strict `JESTER_3D_V4A_ENABLED`, disabled by default.
- Requires the existing `LIVING_ORACLE_V3_ENABLED` layer before the 3D flag can have any effect.
- Detects Jester through the existing Phase 3 observer.
- Dynamically imports the Three.js stage only after Jester is rendered, full motion is allowed, and WebGL is available.
- Portals a pointer-inert Canvas into the existing `.jester-crystal` control without modifying `OracleQR.tsx`.
- Keeps question controls, keyboard input, answer content, answer selection, and reveal timing as existing HTML and Phase 3 behavior.
- Fades the canonical poster only after both 3D assets load and the first frame renders.
- Restores the poster on WebGL, model, clip, React-render, or context-loss failure.
- Stops the animation loop while the Phase 3 lifecycle is paused and disposes geometry, materials, textures, mixers, observers, listeners, and the renderer on teardown.

## Animation mapping

| Phase | Phase 4A behavior |
| --- | --- |
| Idle/listening/awakening/anticipating | `Idle_9` until additional motion receives visual approval |
| Speaking | `Talk_with_Hands_Open`, interrupted immediately when lifecycle advances |
| Reacting | `Big_Heart_Gesture`, interrupted immediately when lifecycle advances |
| Returning | Crossfade to `Idle_9` |
| Paused | Stop mixer and renderer loop |
| Asset error | Tear down Canvas and retain static poster |

`jazz_danc` is optimized and versioned but marked unapproved and is not loaded or played. Walking and Running are not shipped.

## Crystal ball

The ball has its own scene group, transform, material treatment, floating motion, and rotation. It is not merged with or skinned to the Jester. A future implementation can attach that group to a named hand anchor or animate it independently for levitation, presentation, tossing, or juggling.

## Dependency decision

React Three Fiber was evaluated but rejected because the current application resolves React 19.3 while the current Fiber release declares React support below 19.3. The implementation does not force that unsupported peer dependency or downgrade React.

Runtime dependency: `three`.

Build-only asset tooling: `@gltf-transform/cli`, `@gltf-transform/core`, `@gltf-transform/functions`, and `@types/three`.

## Protected areas

No intentional changes were made to `OracleQR.tsx`, answers, QR recording, APIs, Stripe, Printify, Supabase, authentication, Admin, orders, shipping, analytics, Tarot, Shop, Merch, fulfillment, product URLs, or non-Jester Oracle interiors.
