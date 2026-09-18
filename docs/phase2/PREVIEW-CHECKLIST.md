# Phase 2 Vercel Preview Checklist

Use a Vercel Preview deployment only. Do not enable the chamber flag in Production during review.

## Preview setup

- Confirm the Preview branch is `phase2-chamber` and is based on checkpoint `3deba31`.
- Set `ORACLE_CHAMBER_V2_ENABLED=true` for Preview only.
- Confirm every existing Phase 0/1 environment-variable name remains configured.
- Deploy the Preview and record its deployment URL and commit.

## Entrance and fallback

- Open `/`; confirm the cinematic entrance appears.
- Confirm there are no globally visible Sound/Motion controls.
- Activate “Enter the Oracle Chamber” with mouse, touch, Enter, and Space.
- Open `/?classic=1`; confirm the unchanged Phase 1 homepage appears.
- Temporarily test the Preview with the flag removed/false; confirm `/` renders the Phase 1 homepage.

## Oracle selection

- Select Jester, Chaos, Love, Eclipse, and Dragon one at a time.
- Confirm selection is visually clear and announced through `aria-pressed`/live messaging.
- Confirm “Choose another” and Escape return to unselected chamber state.
- Confirm activation reaches the existing paths:
  - `/oracle?theme=jester`
  - `/oracle?theme=chaos`
  - `/oracle?theme=love`
  - `/oracle?theme=eclipse`
  - `/oracle?theme=dnd`
- Confirm Back returns predictably without trapping the visitor.

## Accessibility and motion

- Complete the entrance and selection using keyboard only.
- Confirm focus moves to the chamber heading after entrance.
- Confirm all interactive elements have visible focus.
- Test at 320 px, 375 px, 390 px, 768 px, 1024 px, and a wide desktop viewport.
- Enable operating-system reduced motion; confirm ambient motion is removed and Oracle handoff is immediate.
- Confirm the experience remains understandable with images unavailable.
- Run a screen-reader pass for heading order, landmark names, button names, selected state, and transition status.

## Protected-route smoke

- Open one existing active `/q/[code]`; confirm its Oracle opens and scan recording behaves as in production.
- Open an inactive code; confirm its existing inactive state.
- Open direct legacy links using `theme=classic`, `theme=dragon`, and `theme=dnd`.
- Complete the existing Oracle question/reveal flow for all five themes.
- Open Shop, Merch, a merch detail, Checkout, Tarot, Admin login, Orders, and Analytics.
- In Stripe test mode, complete one artifact and one merch checkout and confirm Phase 0 protections remain intact.
- Confirm Printify submission remains manual/guarded and no duplicate order is created on Success reload.

## Approval record

- Record any visual/accessibility issues with viewport and reproduction steps.
- Confirm the Preview flag is not copied into Production.
- Do not merge or deploy until the Phase 2 review is explicitly approved.
