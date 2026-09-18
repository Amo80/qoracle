import { describe, expect, it } from "vitest";
import {
  INITIAL_CHAMBER_STATE,
  chamberReducer,
  getChamberTransitionDelay,
} from "./machine";

describe("Oracle Chamber state machine", () => {
  it("moves from entrance to chamber without selecting an Oracle", () => {
    expect(chamberReducer(INITIAL_CHAMBER_STATE, { type: "ENTER" })).toEqual({
      stage: "chamber",
      selectedOracle: null,
    });
  });

  it("focuses only a registered production Oracle id", () => {
    const chamber = chamberReducer(INITIAL_CHAMBER_STATE, { type: "ENTER" });
    expect(chamberReducer(chamber, { type: "FOCUS", oracle: "dnd" })).toEqual({
      stage: "focused",
      selectedOracle: "dnd",
    });
  });

  it("cannot transition before an Oracle is selected", () => {
    const chamber = chamberReducer(INITIAL_CHAMBER_STATE, { type: "ENTER" });
    expect(chamberReducer(chamber, { type: "ACTIVATE" })).toBe(chamber);
  });

  it("transitions only the selected Oracle and can return to selection", () => {
    const focused = chamberReducer(
      { stage: "chamber", selectedOracle: null },
      { type: "FOCUS", oracle: "love" }
    );
    expect(chamberReducer(focused, { type: "ACTIVATE" })).toEqual({
      stage: "transitioning",
      selectedOracle: "love",
    });
    expect(chamberReducer(focused, { type: "BACK" })).toEqual({
      stage: "chamber",
      selectedOracle: null,
    });
  });
});

describe("reduced-motion transition contract", () => {
  it("uses an immediate handoff for reduced motion", () => {
    expect(getChamberTransitionDelay("reduced")).toBe(0);
  });

  it("keeps the bounded cinematic handoff for full motion", () => {
    expect(getChamberTransitionDelay("full")).toBe(720);
  });
});
