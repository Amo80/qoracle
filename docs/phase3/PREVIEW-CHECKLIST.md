# Phase 3 Preview Checklist

Use a Vercel Preview deployment only. Do not add the Phase 3 flag to Production during review.

## Flag OFF

- Leave `LIVING_ORACLE_V3_ENABLED` missing or set it to `false`.
- Confirm `/oracle?theme=jester`, `chaos`, `love`, `eclipse`, and `dnd` render the established Phase 2 experience.
- Confirm no shared Living Oracle return control appears.
- Confirm Phase 2 Chamber OFF and ON behavior remains unchanged.

## Flag ON

- Set `LIVING_ORACLE_V3_ENABLED=true` in Preview only.
- Confirm the shared Return to Homepage control appears for all five direct Oracle URLs.
- Confirm Dragon shows only one visible return control.
- Confirm active QR routes retain their database-resolved Oracle identity and record scans normally.
- Confirm inactive and unknown QR behavior is unchanged.

## Lifecycle

For each Oracle:

- Focus the question field and confirm the presentation enters listening without changing input behavior.
- Submit a question and confirm the existing awakening/reveal timing remains intact.
- Confirm the answer appears even if decorative animation is interrupted.
- Ask a second question and verify a clean repeated cycle.
- Background and restore the tab during awakening and during reveal.
- Navigate home using keyboard only.

For Jester, review idle, listening, awakening, anticipation, apparent speaking, reaction, and return-to-idle movement. For the other four, confirm the movement remains lightweight rather than resembling a final character rig.

## Accessibility and resilience

- Test operating-system reduced motion.
- Test the stored reduced-motion preference.
- Confirm answer text remains normal accessible content.
- Confirm the decorative aura is ignored by assistive technology.
- Block a selected image in browser tools and confirm the Oracle question/reveal remains usable.
- Test keyboard focus visibility and a 200% zoom level.

## Responsive

- Test 320 px, 375 px, 430 px, tablet portrait/landscape, and desktop.
- Confirm the return control respects safe-area insets and does not cover question controls.
- Confirm there is no unexpected horizontal scrolling.

## Protected smoke

- Homepage with Chamber flag OFF and ON
- Shop and Merch product pages
- Checkout creation in test mode
- Admin login, QR management, orders, analytics, and tracking
- Tarot draw and redraw
- Success page

Do not merge or deploy to Production until the Preview review is approved.
