import { describe, expect, it, vi } from "vitest";
import { focusWithoutViewportScroll } from "./focusWithoutScroll";

function viewport() {
  return {
    scrollX: 12,
    scrollY: 340,
    scrollTo: vi.fn(function (this: { scrollX: number; scrollY: number }, x: number, y: number) {
      this.scrollX = x;
      this.scrollY = y;
    }),
  };
}

describe("focusWithoutViewportScroll", () => {
  it("requests standards-compatible focus without scrolling", () => {
    const view = viewport();
    const element = { focus: vi.fn() };
    focusWithoutViewportScroll(element, view);
    expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(view.scrollTo).not.toHaveBeenCalled();
  });

  it("restores the viewport when a browser ignores preventScroll", () => {
    const view = viewport();
    const element = {
      focus: vi.fn(() => {
        view.scrollX = 0;
        view.scrollY = 920;
      }),
    };
    focusWithoutViewportScroll(element, view);
    expect(view.scrollTo).toHaveBeenCalledWith(12, 340);
    expect([view.scrollX, view.scrollY]).toEqual([12, 340]);
  });

  it("falls back to focus() and restores scroll when FocusOptions are unsupported", () => {
    const view = viewport();
    const element = {
      focus: vi.fn((options?: FocusOptions) => {
        if (options) throw new TypeError("FocusOptions unsupported");
        view.scrollY = 920;
      }),
    };
    expect(() => focusWithoutViewportScroll(element, view)).not.toThrow();
    expect(element.focus).toHaveBeenNthCalledWith(1, { preventScroll: true });
    expect(element.focus).toHaveBeenNthCalledWith(2);
    expect(view.scrollTo).toHaveBeenCalledWith(12, 340);
  });
});
