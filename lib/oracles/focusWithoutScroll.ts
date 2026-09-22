type FocusTarget = Pick<HTMLElement, "focus">;
type Viewport = Readonly<{
  scrollX: number;
  scrollY: number;
  scrollTo: (x: number, y: number) => void;
}>;

export function focusWithoutViewportScroll(
  element: FocusTarget,
  viewport: Viewport = window
) {
  const scrollX = viewport.scrollX;
  const scrollY = viewport.scrollY;

  try {
    element.focus({ preventScroll: true });
  } catch {
    // Older browsers may reject FocusOptions even though focus itself works.
    element.focus();
  }

  // Protect browsers that accept FocusOptions but ignore preventScroll.
  if (viewport.scrollX !== scrollX || viewport.scrollY !== scrollY) {
    viewport.scrollTo(scrollX, scrollY);
  }
}
