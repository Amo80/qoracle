import type { CharacterPhase } from "../living-oracle/machine";
import type { OracleId } from "../oracles/registry";
import { normalizeClientPresentation } from "./schema";
import type { OracleIntelligencePresentation } from "./types";

export const INTENSITY_MULTIPLIERS = {
  1: 0.88,
  2: 1,
  3: 1.12,
} as const;

export const NEUTRAL_PRESENTATIONS = {
  jester: { oracleId: "jester", emotion: "insightful", intensity: 2, delivery: "sincere", gesture: "idle_presence", reveal: "standard", reaction: "settle", environment: "ball_standard" },
  love: { oracleId: "love", emotion: "warm", intensity: 2, delivery: "measured", gesture: "attentive", reveal: "standard", reaction: "warm", environment: "heart_standard" },
  dnd: { oracleId: "dnd", emotion: "watchful", intensity: 2, delivery: "measured", gesture: "guardian_focus", reveal: "standard", reaction: "restrained", environment: "d20_standard" },
  chaos: { oracleId: "chaos", emotion: "clear", intensity: 2, delivery: "direct", gesture: "core_focus", reveal: "standard", reaction: "settle", environment: "orbit_standard" },
  eclipse: { oracleId: "eclipse", emotion: "contemplative", intensity: 2, delivery: "measured", gesture: "celestial_guidance", reveal: "standard", reaction: "restrained", environment: "balanced" },
} as const satisfies Record<OracleId, OracleIntelligencePresentation>;

export type TrustedPerformanceDirection = Readonly<{
  oracleId: OracleId;
  lifecyclePhase: CharacterPhase;
  intensityMultiplier: 0.88 | 1 | 1.12;
  gesture: string;
  reaction: string;
  environment: string;
  reveal: "subtle" | "standard" | "dramatic";
}>;

export function resolvePerformanceDirection(
  oracleId: OracleId,
  lifecyclePhase: CharacterPhase,
  candidate: unknown
): TrustedPerformanceDirection {
  const presentation = normalizeClientPresentation(candidate, oracleId) ?? NEUTRAL_PRESENTATIONS[oracleId];
  return {
    oracleId,
    lifecyclePhase,
    intensityMultiplier: INTENSITY_MULTIPLIERS[presentation.intensity],
    gesture: presentation.gesture,
    reaction: presentation.reaction,
    environment: presentation.environment,
    reveal: presentation.reveal,
  };
}
