import type { MotionPreference } from "@/lib/experience/preferences";

export type CharacterPhase =
  | "idle"
  | "listening"
  | "awakening"
  | "anticipating"
  | "speaking"
  | "reacting"
  | "returning"
  | "paused"
  | "asset-error";

type ResumablePhase = Exclude<CharacterPhase, "paused" | "asset-error">;

export type CharacterState = Readonly<{
  phase: CharacterPhase;
  cycle: number;
  resumePhase: ResumablePhase | null;
}>;

export type CharacterEvent =
  | Readonly<{ type: "FOCUS" }>
  | Readonly<{ type: "BLUR" }>
  | Readonly<{ type: "SUBMIT" }>
  | Readonly<{ type: "AWAKENED"; cycle: number }>
  | Readonly<{ type: "REVEAL"; cycle: number }>
  | Readonly<{ type: "SPEECH_COMPLETE"; cycle: number }>
  | Readonly<{ type: "REACTION_COMPLETE"; cycle: number }>
  | Readonly<{ type: "RETURN_COMPLETE"; cycle: number }>
  | Readonly<{ type: "RESET" }>
  | Readonly<{ type: "HIDDEN" }>
  | Readonly<{ type: "VISIBLE" }>
  | Readonly<{ type: "ASSET_ERROR" }>
  | Readonly<{ type: "ASSET_READY" }>;

export const INITIAL_CHARACTER_STATE: CharacterState = {
  phase: "idle",
  cycle: 0,
  resumePhase: null,
};

function isCurrentCycle(state: CharacterState, cycle: number) {
  return state.cycle === cycle;
}

export function characterReducer(
  state: CharacterState,
  event: CharacterEvent
): CharacterState {
  switch (event.type) {
    case "FOCUS":
      return state.phase === "idle"
        ? { ...state, phase: "listening" }
        : state;
    case "BLUR":
      return state.phase === "listening" ? { ...state, phase: "idle" } : state;
    case "SUBMIT":
      return state.phase === "paused"
        ? state
        : { phase: "awakening", cycle: state.cycle + 1, resumePhase: null };
    case "AWAKENED":
      return isCurrentCycle(state, event.cycle) && state.phase === "awakening"
        ? { ...state, phase: "anticipating" }
        : state;
    case "REVEAL":
      return isCurrentCycle(state, event.cycle) &&
        (state.phase === "awakening" || state.phase === "anticipating")
        ? { ...state, phase: "speaking" }
        : state;
    case "SPEECH_COMPLETE":
      return isCurrentCycle(state, event.cycle) && state.phase === "speaking"
        ? { ...state, phase: "reacting" }
        : state;
    case "REACTION_COMPLETE":
      return isCurrentCycle(state, event.cycle) && state.phase === "reacting"
        ? { ...state, phase: "returning" }
        : state;
    case "RETURN_COMPLETE":
      return isCurrentCycle(state, event.cycle) && state.phase === "returning"
        ? { ...state, phase: "idle" }
        : state;
    case "RESET":
      return { ...state, phase: "idle", resumePhase: null };
    case "HIDDEN":
      return state.phase === "paused"
        ? state
        : {
            ...state,
            phase: "paused",
            resumePhase:
              state.phase === "asset-error" ? "idle" : state.phase,
          };
    case "VISIBLE":
      return state.phase === "paused"
        ? { ...state, phase: state.resumePhase || "idle", resumePhase: null }
        : state;
    case "ASSET_ERROR":
      return { ...state, phase: "asset-error", resumePhase: null };
    case "ASSET_READY":
      return state.phase === "asset-error"
        ? { ...state, phase: "idle" }
        : state;
  }
}

export const FULL_MOTION_TIMINGS = {
  awakening: 450,
  speaking: 900,
  reaction: 650,
  returning: 450,
} as const;

export function getCharacterTimings(motion: MotionPreference) {
  return motion === "reduced"
    ? { awakening: 0, speaking: 0, reaction: 0, returning: 0 }
    : FULL_MOTION_TIMINGS;
}
