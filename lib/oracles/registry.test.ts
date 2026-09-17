import { describe, expect, it } from "vitest";
import {
  ORACLE_IDS,
  ORACLES,
  getOracle,
  isOracleId,
  normalizeOracleId,
} from "./registry";

describe("Oracle compatibility contract", () => {
  it("preserves the five production theme identifiers and display order", () => {
    expect(ORACLE_IDS).toEqual([
      "jester",
      "chaos",
      "love",
      "eclipse",
      "dnd",
    ]);
    expect(ORACLES.map((oracle) => oracle.name)).toEqual([
      "JESTER",
      "CHAOS",
      "LOVE",
      "ECLIPSE",
      "DRAGON",
    ]);
  });

  it("keeps legacy Classic and Dragon links compatible", () => {
    expect(normalizeOracleId("Classic")).toBe("jester");
    expect(normalizeOracleId("dragon")).toBe("dnd");
    expect(normalizeOracleId("DND")).toBe("dnd");
  });

  it("falls back safely for absent and unknown themes", () => {
    expect(normalizeOracleId()).toBe("jester");
    expect(normalizeOracleId("unknown-theme")).toBe("jester");
  });

  it("exposes stable URLs and existing artwork", () => {
    expect(getOracle("love")).toMatchObject({
      oraclePath: "/oracle?theme=love",
      image: "/themes/love-crystal-ball.png",
    });
    expect(getOracle("dragon")).toMatchObject({
      id: "dnd",
      oraclePath: "/oracle?theme=dnd",
      image: "/themes/DND.crystal.png",
    });
  });

  it("distinguishes stored production identifiers from aliases", () => {
    expect(isOracleId("dnd")).toBe(true);
    expect(isOracleId("dragon")).toBe(false);
  });
});
