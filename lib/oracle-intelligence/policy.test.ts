import { describe, expect, it } from "vitest";
import { decideFallback, fallbackAllowedForSafety } from "./fallback";
import { decideSafetyPolicy, detectUnambiguousCrisisSignal } from "./safety";

describe("intelligence fallback and safety policy", () => {
  it.each(["disabled", "missing_configuration", "timeout", "provider_error", "malformed_output", "validation_rejection", "benign_refusal", "rate_limited"] as const)("permits protected fallback for ordinary %s outcomes", (outcome) => {
    expect(decideFallback(outcome)).toEqual({ action: "use_protected_library", reason: outcome });
  });

  it("keeps success and superseded cycles out of fallback selection", () => {
    expect(decideFallback("success")).toEqual({ action: "use_ai" });
    expect(decideFallback("superseded")).toEqual({ action: "discard_superseded" });
  });

  it("prohibits random fortunes for crisis, high-stakes, and safety refusal", () => {
    expect(decideFallback("crisis")).toEqual({ action: "use_safety_response", category: "crisis" });
    expect(decideFallback("safety_refusal")).toEqual({ action: "use_safety_response", category: "refusal" });
    expect(fallbackAllowedForSafety("crisis")).toBe(false);
    expect(fallbackAllowedForSafety("high_stakes")).toBe(false);
    expect(decideSafetyPolicy("high_stakes").deterministicSafetyResponseRequired).toBe(true);
  });

  it("uses only a conservative unambiguous local crisis signal", () => {
    expect(detectUnambiguousCrisisSignal("I want to end my life")).toBe(true);
    expect(detectUnambiguousCrisisSignal("My job is killing me lately")).toBe(false);
  });
});
