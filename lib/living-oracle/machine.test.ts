import { describe, expect, it } from "vitest";
import {
  INITIAL_CHARACTER_STATE,
  characterReducer,
  getCharacterTimings,
} from "./machine";

function completeCycle(cycle = 1) {
  let state = characterReducer(INITIAL_CHARACTER_STATE, { type: "FOCUS" });
  state = characterReducer(state, { type: "SUBMIT" });
  state = characterReducer(state, { type: "AWAKENED", cycle });
  state = characterReducer(state, { type: "REVEAL", cycle });
  state = characterReducer(state, { type: "SPEECH_COMPLETE", cycle });
  state = characterReducer(state, { type: "REACTION_COMPLETE", cycle });
  return characterReducer(state, { type: "RETURN_COMPLETE", cycle });
}

describe("Living Oracle character lifecycle", () => {
  it("moves through listening, awakening, anticipation, speaking, reaction, and idle", () => {
    let state = characterReducer(INITIAL_CHARACTER_STATE, { type: "FOCUS" });
    expect(state.phase).toBe("listening");
    state = characterReducer(state, { type: "SUBMIT" });
    expect(state).toMatchObject({ phase: "awakening", cycle: 1 });
    state = characterReducer(state, { type: "AWAKENED", cycle: 1 });
    expect(state.phase).toBe("anticipating");
    state = characterReducer(state, { type: "REVEAL", cycle: 1 });
    expect(state.phase).toBe("speaking");
    state = characterReducer(state, { type: "SPEECH_COMPLETE", cycle: 1 });
    expect(state.phase).toBe("reacting");
    state = characterReducer(state, { type: "REACTION_COMPLETE", cycle: 1 });
    expect(state.phase).toBe("returning");
    state = characterReducer(state, { type: "RETURN_COMPLETE", cycle: 1 });
    expect(state.phase).toBe("idle");
  });

  it("supports repeated question cycles without leaking the previous cycle", () => {
    let state = completeCycle();
    state = characterReducer(state, { type: "SUBMIT" });
    expect(state).toMatchObject({ phase: "awakening", cycle: 2 });
  });

  it("rejects stale asynchronous transitions", () => {
    let state = characterReducer(INITIAL_CHARACTER_STATE, { type: "SUBMIT" });
    state = characterReducer(state, { type: "SUBMIT" });
    expect(state.cycle).toBe(2);
    expect(characterReducer(state, { type: "REVEAL", cycle: 1 })).toBe(state);
  });

  it("pauses while hidden and resumes the prior presentation phase", () => {
    let state = characterReducer(INITIAL_CHARACTER_STATE, { type: "SUBMIT" });
    state = characterReducer(state, { type: "HIDDEN" });
    expect(state).toMatchObject({ phase: "paused", resumePhase: "awakening" });
    state = characterReducer(state, { type: "VISIBLE" });
    expect(state).toMatchObject({ phase: "awakening", resumePhase: null });
  });

  it("falls back safely when an asset fails and can recover", () => {
    let state = characterReducer(INITIAL_CHARACTER_STATE, { type: "ASSET_ERROR" });
    expect(state.phase).toBe("asset-error");
    state = characterReducer(state, { type: "ASSET_READY" });
    expect(state.phase).toBe("idle");
  });

  it("removes all decorative lifecycle delays for reduced motion", () => {
    expect(getCharacterTimings("reduced")).toEqual({
      awakening: 0,
      speaking: 0,
      reaction: 0,
      returning: 0,
    });
  });
});
