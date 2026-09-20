import { describe, expect, it } from "vitest";
import { detectWebGLSupport } from "./webgl";

describe("WebGL capability fallback", () => {
  it("returns false when a document is unavailable", () => {
    expect(detectWebGLSupport(undefined)).toBe(false);
  });

  it("returns false when canvas creation or context lookup fails", () => {
    expect(
      detectWebGLSupport({
        createElement: () => {
          throw new Error("blocked");
        },
      })
    ).toBe(false);
    expect(
      detectWebGLSupport({
        createElement: () => ({ getContext: () => null }),
      })
    ).toBe(false);
  });

  it("accepts either WebGL 2 or WebGL 1", () => {
    expect(
      detectWebGLSupport({
        createElement: () => ({
          getContext: (name: string) => (name === "webgl2" ? {} : null),
        }),
      })
    ).toBe(true);
  });
});
