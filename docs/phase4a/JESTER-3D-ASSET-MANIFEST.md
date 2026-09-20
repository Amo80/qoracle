# Phase 4A Jester 3D Asset Manifest

## Source policy

The raw Meshy exports remain preserved outside deployable `public`. They are not copied into the application repository. `scripts/prepare-jester-3d.mjs` accepts their location through `JESTER_SOURCE_DIR` and `JESTER_BALL_SOURCE` and produces versioned derivatives only.

Exact source and output hashes are recorded in `public/characters/jester/v1/asset-manifest.json`.

## Runtime outputs

| Asset | Purpose | Bytes |
| --- | --- | ---: |
| `jester-base.glb` | One skinned Jester mesh, shared material/textures, `Idle_9` | 5,306,504 |
| `animations/talk.glb` | Animation-only `Talk_with_Hands_Open` | 59,764 |
| `animations/heart.glb` | Animation-only `Big_Heart_Gesture` | 90,980 |
| `animations/jazz.glb` | Animation-only `jazz_danc`; packaged but not approved for playback | 49,256 |
| `crystal-ball.glb` | Independent crystal-ball mesh and textures | 1,765,912 |

Initial model transfer is base plus ball: 7,072,416 bytes (6.74 MiB). Speaking and reaction clips are loaded only when first required.

## Non-destructive transforms

- Retained the complete 41,474-vertex, 30,906-triangle Jester mesh.
- Retained the 28-joint Meshy/Mixamo-compatible skeleton.
- Retained only the meaningful primary animation in each source file.
- Removed an invalid zero-length tangent accessor present in the raw Jester export. Three.js derives tangent space when the normal map is used.
- Resampled redundant animation keyframes losslessly.
- Removed duplicate mesh, skin, material, and texture data from animation-only files.
- Resized Jester textures from 4096 square to 2048 square using Lanczos3.
- Converted runtime textures to WebP at quality 88.
- Converted the ball textures to WebP at quality 88.
- Removed unreferenced accessors.
- Did not simplify or decimate either mesh.

## Known validation warnings

There are no remaining glTF validation errors. The base model retains two non-fatal warnings:

- Runtime-generated tangent space is required because the source tangent accessor contains invalid zero-length values.
- The Meshy skinned-mesh node is not a scene root. Its existing parent has no transform, so Phase 4A does not alter this hierarchy without visual qualification.

The independent ball also uses runtime-generated tangent space for its normal map.

## Current rig limits

The model has no facial morph targets and no dedicated eyelid, eyebrow, jaw, lip, or detailed finger controls. Phase 4A does not fake those capabilities. The runtime reserves a future facial-control boundary, but current presentation uses only the supplied body rig and clips.

Walking and Running are intentionally absent from the runtime package.
