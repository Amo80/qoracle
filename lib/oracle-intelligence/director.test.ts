import { describe, expect, it } from "vitest";
import { ECLIPSE_CELESTIAL_SIDES } from "../living-oracle/eclipse3d";
import { INTENSITY_MULTIPLIERS, NEUTRAL_PRESENTATIONS, resolvePerformanceDirection } from "./director";

describe("trusted Oracle performance director", () => {
  it("returns neutral production-compatible direction for untrusted input", () => {
    const direction = resolvePerformanceDirection("jester", "speaking", { gesture: "rotate_head_bone", intensity: 999 });
    expect(direction).toEqual({
      oracleId: "jester",
      lifecyclePhase: "speaking",
      intensityMultiplier: 1,
      gesture: NEUTRAL_PRESENTATIONS.jester.gesture,
      reaction: NEUTRAL_PRESENTATIONS.jester.reaction,
      environment: NEUTRAL_PRESENTATIONS.jester.environment,
      reveal: "standard",
    });
  });

  it("maps only validated intensity levels to conservative bounds", () => {
    expect(INTENSITY_MULTIPLIERS).toEqual({ 1: 0.88, 2: 1, 3: 1.12 });
    for (const intensity of [1, 2, 3] as const) {
      const candidate = { ...NEUTRAL_PRESENTATIONS.love, intensity };
      expect(resolvePerformanceDirection("love", "reacting", candidate).intensityMultiplier).toBe(INTENSITY_MULTIPLIERS[intensity]);
    }
  });

  it("preserves lifecycle authority and the Eclipse celestial-side invariant", () => {
    const direction = resolvePerformanceDirection("eclipse", "speaking", { ...NEUTRAL_PRESENTATIONS.eclipse, environment: "solar_emphasis", intensity: 3 });
    expect(direction.lifecyclePhase).toBe("speaking");
    expect(direction).not.toHaveProperty("duration");
    expect(direction).not.toHaveProperty("transform");
    expect(direction).not.toHaveProperty("bone");
    expect(ECLIPSE_CELESTIAL_SIDES).toEqual({ sun: "right-hand-gold", moon: "left-hand-violet" });
  });
});
