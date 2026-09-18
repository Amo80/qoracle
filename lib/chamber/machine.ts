import type { MotionPreference } from "@/lib/experience/preferences";
import type { OracleId } from "@/lib/oracles/registry";

export type ChamberStage =
  | "entrance"
  | "chamber"
  | "focused"
  | "transitioning";

export type ChamberState = Readonly<{
  stage: ChamberStage;
  selectedOracle: OracleId | null;
}>;

export type ChamberEvent =
  | Readonly<{ type: "ENTER" }>
  | Readonly<{ type: "FOCUS"; oracle: OracleId }>
  | Readonly<{ type: "ACTIVATE" }>
  | Readonly<{ type: "BACK" }>;

export const INITIAL_CHAMBER_STATE: ChamberState = {
  stage: "entrance",
  selectedOracle: null,
};

export function chamberReducer(
  state: ChamberState,
  event: ChamberEvent
): ChamberState {
  switch (event.type) {
    case "ENTER":
      return state.stage === "entrance"
        ? { stage: "chamber", selectedOracle: null }
        : state;
    case "FOCUS":
      return state.stage === "chamber" || state.stage === "focused"
        ? { stage: "focused", selectedOracle: event.oracle }
        : state;
    case "ACTIVATE":
      return state.stage === "focused" && state.selectedOracle
        ? { stage: "transitioning", selectedOracle: state.selectedOracle }
        : state;
    case "BACK":
      return state.stage === "focused"
        ? { stage: "chamber", selectedOracle: null }
        : state;
  }
}

export function getChamberTransitionDelay(motion: MotionPreference) {
  return motion === "reduced" ? 0 : 720;
}
