# Character Asset Requirements and Phase 3 Limitations

## Jester vertical-slice finding

The existing Jester PNG is a flattened composite containing the character and crystal-ball performance in one image. It safely supports whole-character transforms, glow, timing, and apparent-speaking movement, but it cannot independently animate eyelids, pupils, mouth shapes, hands, head, body, or the ball.

Phase 3 therefore uses restrained movement of the complete artwork. It does not fake detailed lip-sync or distort the image into an artificial rig.

## Assets needed for production character work

Each future Oracle package should include:

- Layered master art with transparent separation for body, head, eyes, eyelids, mouth, appendages, ball, foreground occlusion, and effects where the design supports them.
- Neutral idle, listening, awakening, anticipation, speaking, positive/uncertain/ominous reaction, and return poses.
- Two to four mouth shapes for audio-independent apparent speaking where appropriate.
- Mobile and desktop safe-crop specifications.
- A static poster and reduced-motion pose.
- An independent failure fallback.
- Optimized AVIF/WebP/PNG exports at measured breakpoints.
- Asset version and licensing/provenance records.

## Oracle-specific direction

| Oracle | Future production movement |
| --- | --- |
| Jester | Eye, face, head, hand, and prop performance with playful misdirection |
| Chaos | Fragmented posture, controlled glitches, asymmetric motion, and reality distortion |
| Love | Graceful gaze, warm expression, flowing gesture, and emotional restraint |
| Eclipse | Slow celestial movement, shadow transitions, appearing and receding |
| Dragon (`dnd`) | Eye focus, breathing, head/body/wing movement, and powerful restraint |

## Performance requirements

- Do not place all five production bundles in the entry route.
- Keep the manifest's selected-only loading contract.
- Ship static and reduced-motion alternatives independently of the animation runtime.
- Prefer layered 2D/Web Animations or a measured interactive rig over long autoplay video.
- Evaluate any new animation runtime in isolation before adopting it across all five Oracles.

Final character rigs remain Phase 4. Voice and true timed visemes remain later work. AI generation remains Phase 5.
