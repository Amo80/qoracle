import { describe, expect, it } from "vitest";
import {
  isLivingOracleEnabled,
  isOracleChamberEnabled,
  shouldRenderOracleChamber,
} from "./featureFlags";

describe("Oracle Chamber feature flag", () => {
  it("is disabled when the environment value is missing", () => {
    expect(isOracleChamberEnabled({})).toBe(false);
  });

  it("is disabled for false, blank, and unexpected values", () => {
    expect(isOracleChamberEnabled({ ORACLE_CHAMBER_V2_ENABLED: "false" })).toBe(false);
    expect(isOracleChamberEnabled({ ORACLE_CHAMBER_V2_ENABLED: "" })).toBe(false);
    expect(isOracleChamberEnabled({ ORACLE_CHAMBER_V2_ENABLED: "1" })).toBe(false);
  });

  it("is enabled only by an explicit true value", () => {
    expect(isOracleChamberEnabled({ ORACLE_CHAMBER_V2_ENABLED: "true" })).toBe(true);
    expect(isOracleChamberEnabled({ ORACLE_CHAMBER_V2_ENABLED: "TRUE" })).toBe(true);
  });

  it("keeps the classic homepage available while the flag is enabled", () => {
    expect(
      shouldRenderOracleChamber({
        environment: { ORACLE_CHAMBER_V2_ENABLED: "true" },
        classicRequested: true,
      })
    ).toBe(false);
  });
});

describe("Living Oracle feature flag", () => {
  it("is disabled by default and for unexpected values", () => {
    expect(isLivingOracleEnabled({})).toBe(false);
    expect(isLivingOracleEnabled({ LIVING_ORACLE_V3_ENABLED: "false" })).toBe(
      false
    );
    expect(isLivingOracleEnabled({ LIVING_ORACLE_V3_ENABLED: "1" })).toBe(false);
  });

  it("is enabled only by an explicit true value", () => {
    expect(isLivingOracleEnabled({ LIVING_ORACLE_V3_ENABLED: "true" })).toBe(
      true
    );
    expect(isLivingOracleEnabled({ LIVING_ORACLE_V3_ENABLED: "TRUE" })).toBe(
      true
    );
  });
});
