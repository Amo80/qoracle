import type { OracleId } from "../oracles/registry";

export const INTELLIGENCE_SCHEMA_VERSION = "1" as const;

export const COMMON_REVEALS = ["subtle", "standard", "dramatic"] as const;
export const INTENSITY_LEVELS = [1, 2, 3] as const;

export const ORACLE_PERFORMANCE_VOCABULARIES = {
  jester: {
    emotions: ["mischievous", "playful", "insightful"] as const,
    deliveries: ["teasing", "theatrical", "sincere"] as const,
    gestures: ["idle_presence", "open_hands", "heart_flourish"] as const,
    reactions: ["playful", "heartfelt", "settle"] as const,
    environments: ["ball_low", "ball_standard", "ball_bright"] as const,
  },
  love: {
    emotions: ["warm", "compassionate", "reflective", "firm"] as const,
    deliveries: ["tender", "measured", "direct"] as const,
    gestures: ["attentive", "restrained_open", "gentle_present", "heart_inward_outward"] as const,
    reactions: ["warm", "reflective", "reassure"] as const,
    environments: ["heart_low", "heart_standard", "heart_strong"] as const,
  },
  dnd: {
    emotions: ["solemn", "challenging", "triumphant", "watchful"] as const,
    deliveries: ["mythic", "direct", "measured"] as const,
    gestures: ["guardian_focus", "restrained_lift", "head_neck_emphasis", "wing_root_emphasis"] as const,
    reactions: ["restrained", "powerful", "settle"] as const,
    environments: ["d20_low", "d20_standard", "d20_high", "altar_low", "altar_standard", "altar_high"] as const,
  },
  chaos: {
    emotions: ["unpredictable", "energetic", "strange", "clear"] as const,
    deliveries: ["lateral", "dramatic", "direct"] as const,
    gestures: ["core_focus", "fragments_contract", "fragments_spread", "controlled_instability"] as const,
    reactions: ["restrained_burst", "strong_burst", "settle"] as const,
    environments: ["orbit_slow", "orbit_standard", "orbit_fast", "reverse_approved", "pedestal_low", "pedestal_high"] as const,
  },
  eclipse: {
    emotions: ["regal", "mysterious", "contemplative", "resolute"] as const,
    deliveries: ["measured", "dual", "solemn"] as const,
    gestures: ["celestial_guidance", "eclipse_presentation"] as const,
    reactions: ["restrained", "strong", "settle"] as const,
    environments: ["balanced", "solar_emphasis", "lunar_emphasis", "corona_low", "corona_standard", "corona_strong"] as const,
  },
} as const;

export type PerformanceVocabulary =
  (typeof ORACLE_PERFORMANCE_VOCABULARIES)[OracleId];

export function getPerformanceVocabulary(oracleId: OracleId) {
  return ORACLE_PERFORMANCE_VOCABULARIES[oracleId];
}
