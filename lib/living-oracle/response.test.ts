import { describe, expect, it } from "vitest";
import {
  NEUTRAL_PRESENTATION,
  createProtectedOracleResponse,
  isOraclePresentation,
} from "./response";

describe("AI-ready Oracle response contract", () => {
  it("wraps a protected answer without changing its text", () => {
    const response = createProtectedOracleResponse({
      oracleId: "jester",
      text: "The answer remains exactly as written.",
    });
    expect(response.text).toBe("The answer remains exactly as written.");
    expect(response.source).toBe("protected-library");
    expect(response.presentation).toEqual(NEUTRAL_PRESENTATION);
  });

  it("accepts only bounded semantic presentation cues", () => {
    expect(isOraclePresentation(NEUTRAL_PRESENTATION)).toBe(true);
    expect(
      isOraclePresentation({
        ...NEUTRAL_PRESENTATION,
        emotion: "execute-javascript",
      })
    ).toBe(false);
    expect(
      isOraclePresentation({ ...NEUTRAL_PRESENTATION, intensity: 99 })
    ).toBe(false);
  });
});
