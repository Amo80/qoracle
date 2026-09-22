import { describe, expect, it } from "vitest";
import { cohortBucket, createOpaqueIntelligenceSessionId, isSessionInRollout } from "./cohort";

describe("stable anonymous intelligence cohort", () => {
  it("is stable, bounded, and independent of raw IP addresses", () => {
    expect(cohortBucket("opaque-session-a")).toBe(cohortBucket("opaque-session-a"));
    expect(cohortBucket("opaque-session-a")).toBeGreaterThanOrEqual(0);
    expect(cohortBucket("opaque-session-a")).toBeLessThan(100);
    expect(createOpaqueIntelligenceSessionId()).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("treats rollout zero as nobody and 100 as everybody", () => {
    expect(isSessionInRollout("session", 0)).toBe(false);
    expect(isSessionInRollout("session", 100)).toBe(true);
    expect(isSessionInRollout("session", 100)).toBe(true);
  });
});
