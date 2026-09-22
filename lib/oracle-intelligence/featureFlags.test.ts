import { describe, expect, it } from "vitest";
import {
  getOracleIntelligenceRolloutPercent,
  isOracleIntelligenceEnabled,
  isOracleIntelligenceEnabledFor,
} from "../experience/featureFlags";

describe("Oracle Intelligence flags", () => {
  it("defaults master, Oracle flags, and rollout to disabled", () => {
    expect(isOracleIntelligenceEnabled({})).toBe(false);
    expect(getOracleIntelligenceRolloutPercent({})).toBe(0);
    for (const oracleId of ["jester", "love", "dnd", "chaos", "eclipse"] as const) {
      expect(isOracleIntelligenceEnabledFor(oracleId, {})).toBe(false);
    }
  });

  it("requires master, matching Oracle flag, and a non-zero valid rollout", () => {
    const environment = {
      ORACLE_INTELLIGENCE_ENABLED: "true",
      ORACLE_INTELLIGENCE_JESTER_ENABLED: "true",
      ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: "10",
    };
    expect(isOracleIntelligenceEnabledFor("jester", environment)).toBe(true);
    expect(isOracleIntelligenceEnabledFor("love", environment)).toBe(false);
    expect(isOracleIntelligenceEnabledFor("jester", { ...environment, ORACLE_INTELLIGENCE_ENABLED: "false" })).toBe(false);
  });

  it.each(["-1", "101", "1.5", "truthy", "", " 200 "])("normalizes invalid rollout %s to zero", (value) => {
    expect(getOracleIntelligenceRolloutPercent({ ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: value })).toBe(0);
  });

  it.each([["0", 0], ["1", 1], [" 25 ", 25], ["100", 100]] as const)("accepts rollout %s", (value, expected) => {
    expect(getOracleIntelligenceRolloutPercent({ ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: value })).toBe(expected);
  });
});
