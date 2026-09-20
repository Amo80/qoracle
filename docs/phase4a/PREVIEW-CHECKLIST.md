# Phase 4A Preview Checklist

Use a Vercel Preview deployment only. Do not add the Phase 4A flag to Production.

## Environment configurations

### Full rollback

```text
LIVING_ORACLE_V3_ENABLED=false
JESTER_3D_V4A_ENABLED=false
```

Expected: the established pre-Phase-3 Oracle presentation.

### Phase 3 static Jester

```text
LIVING_ORACLE_V3_ENABLED=true
JESTER_3D_V4A_ENABLED=false
```

Expected: Phase 3 shared shell and canonical static Jester.

### Phase 4A review

```text
LIVING_ORACLE_V3_ENABLED=true
JESTER_3D_V4A_ENABLED=true
```

Expected: 3D assets load only after entering Jester with full motion and supported WebGL.

## Visual acceptance

- The canonical poster is visible immediately and does not flash away before the first 3D frame.
- The 3D Jester remains unmistakably the approved Meshy character.
- Camera framing works at 320, 375, 430, tablet, laptop, and desktop widths.
- Jester is not clipped at the hat, hands, or feet.
- The independent ball is scaled and positioned naturally relative to the Jester.
- Lighting preserves costume colors and facial readability.
- `Idle_9` loops without a visible jump.
- Focusing the question does not disrupt input or keyboard interaction.
- Submitting a question does not change the existing answer delay.
- `Talk_with_Hands_Open` crossfades in when the answer appears.
- The speaking clip is interrupted cleanly when the lifecycle advances.
- `Big_Heart_Gesture` reads as an appropriate Jester reaction; if not, keep it packaged but disable it pending a better general reaction clip.
- Return to idle is clean and does not snap.
- The ball floats and rotates independently without appearing attached to the skin.
- `jazz_danc` remains inactive pending separate visual approval.

## Accessibility and failure

- Enable operating-system reduced motion before entry: no Three.js chunk or GLB requests should occur.
- Set stored motion preference to reduced: the canonical static poster remains.
- Disable WebGL: the Oracle remains fully usable with the poster.
- Block the base model, ball, talk clip, and heart clip individually: the poster returns and the answer still appears.
- Trigger WebGL context loss in browser tools: the poster returns.
- Background and restore the tab during idle, thinking, speaking, and reaction.
- Use keyboard only to focus, ask, ask again, and return home.
- Verify the Canvas is decorative and absent from the accessibility tree.
- Verify answer text remains selectable/readable HTML at 200% zoom.

## Network and performance

- Confirm no Three.js or Jester GLB request on homepage, Chamber, non-Jester Oracle, Shop, Merch, Admin, or Tarot.
- Confirm Jester initially requests only the base and ball.
- Confirm Talk loads on first speaking phase and Heart on first reaction phase.
- Record mobile transferred bytes, decoded texture memory, frame rate, long tasks, and peak memory.
- Test a representative lower-capability mobile device before approval.

## Protected smoke

- Homepage with Chamber flag off and on
- All five direct Oracle URLs
- Active and inactive QR routes
- Existing Jester ASK → AWAKEN → REVEAL timing
- Exact answer content remains unchanged
- Shop and Merch
- Stripe Checkout in test mode
- Admin login, QR management, orders, analytics, and tracking
- Tarot draw and redraw
- Success page
