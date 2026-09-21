import { describe, expect, it } from "vitest";
import {
  isJester3DEnabled,
  isLove3DEnabled,
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

describe("Love 3D feature flag", () => {
  it("is disabled by default and accepts only true", () => {
    expect(isLove3DEnabled({})).toBe(false);
    expect(isLove3DEnabled({ LOVE_3D_V4B_ENABLED: "false" })).toBe(false);
    expect(isLove3DEnabled({ LOVE_3D_V4B_ENABLED: "1" })).toBe(false);
    expect(isLove3DEnabled({ LOVE_3D_V4B_ENABLED: " TRUE " })).toBe(true);
  });
});

describe("Jester 3D Phase 4A feature flag", () => {
  it("is disabled by default and for unexpected values", () => {
    expect(isJester3DEnabled({})).toBe(false);
    expect(isJester3DEnabled({ JESTER_3D_V4A_ENABLED: "false" })).toBe(false);
    expect(isJester3DEnabled({ JESTER_3D_V4A_ENABLED: "1" })).toBe(false);
  });

  it("is enabled only by an explicit true value", () => {
    expect(isJester3DEnabled({ JESTER_3D_V4A_ENABLED: "true" })).toBe(true);
    expect(isJester3DEnabled({ JESTER_3D_V4A_ENABLED: "TRUE" })).toBe(true);
  });

  it("remains independently disableable from the Phase 3 flag", () => {
    const environment = {
      LIVING_ORACLE_V3_ENABLED: "true",
      JESTER_3D_V4A_ENABLED: "false",
    };
    expect(isLivingOracleEnabled(environment)).toBe(true);
    expect(isJester3DEnabled(environment)).toBe(false);
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
