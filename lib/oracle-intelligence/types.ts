import type { OracleId } from "../oracles/registry";
import type { INTELLIGENCE_SCHEMA_VERSION } from "./vocabularies";

export type IntelligenceSchemaVersion = typeof INTELLIGENCE_SCHEMA_VERSION;
export type IntelligenceSafetyCategory =
  | "standard"
  | "sensitive"
  | "high_stakes"
  | "crisis"
  | "refusal";
export type SafetyDeliveryMode = "in_character" | "softened" | "direct";
export type IntelligenceIntensity = 1 | 2 | 3;
export type IntelligenceReveal = "subtle" | "standard" | "dramatic";

type PresentationBase<T extends OracleId> = Readonly<{
  oracleId: T;
  intensity: IntelligenceIntensity;
  reveal: IntelligenceReveal;
}>;

export type JesterPresentation = PresentationBase<"jester"> & Readonly<{
  emotion: "mischievous" | "playful" | "insightful";
  delivery: "teasing" | "theatrical" | "sincere";
  gesture: "idle_presence" | "open_hands" | "heart_flourish";
  reaction: "playful" | "heartfelt" | "settle";
  environment: "ball_low" | "ball_standard" | "ball_bright";
}>;

export type LovePresentation = PresentationBase<"love"> & Readonly<{
  emotion: "warm" | "compassionate" | "reflective" | "firm";
  delivery: "tender" | "measured" | "direct";
  gesture: "attentive" | "restrained_open" | "gentle_present" | "heart_inward_outward";
  reaction: "warm" | "reflective" | "reassure";
  environment: "heart_low" | "heart_standard" | "heart_strong";
}>;

export type DungeonPresentation = PresentationBase<"dnd"> & Readonly<{
  emotion: "solemn" | "challenging" | "triumphant" | "watchful";
  delivery: "mythic" | "direct" | "measured";
  gesture: "guardian_focus" | "restrained_lift" | "head_neck_emphasis" | "wing_root_emphasis";
  reaction: "restrained" | "powerful" | "settle";
  environment: "d20_low" | "d20_standard" | "d20_high" | "altar_low" | "altar_standard" | "altar_high";
}>;

export type ChaosPresentation = PresentationBase<"chaos"> & Readonly<{
  emotion: "unpredictable" | "energetic" | "strange" | "clear";
  delivery: "lateral" | "dramatic" | "direct";
  gesture: "core_focus" | "fragments_contract" | "fragments_spread" | "controlled_instability";
  reaction: "restrained_burst" | "strong_burst" | "settle";
  environment: "orbit_slow" | "orbit_standard" | "orbit_fast" | "reverse_approved" | "pedestal_low" | "pedestal_high";
}>;

export type EclipsePresentation = PresentationBase<"eclipse"> & Readonly<{
  emotion: "regal" | "mysterious" | "contemplative" | "resolute";
  delivery: "measured" | "dual" | "solemn";
  gesture: "celestial_guidance" | "eclipse_presentation";
  reaction: "restrained" | "strong" | "settle";
  environment: "balanced" | "solar_emphasis" | "lunar_emphasis" | "corona_low" | "corona_standard" | "corona_strong";
}>;

export type OracleIntelligencePresentation =
  | JesterPresentation
  | LovePresentation
  | DungeonPresentation
  | ChaosPresentation
  | EclipsePresentation;

export type OracleIntelligenceRequestV1 = Readonly<{
  schemaVersion: "1";
  requestId: string;
  cycleId: string;
  oracleId: OracleId;
  question: string;
}>;

/** Untrusted provider-controlled fields only. */
export type ProviderOracleOutputV1 = Readonly<{
  schemaVersion: "1";
  oracleId: OracleId;
  answer: string;
  presentation: OracleIntelligencePresentation;
  safety: Readonly<{
    category: IntelligenceSafetyCategory;
    deliveryMode: SafetyDeliveryMode;
  }>;
}>;

export type FallbackReason =
  | "disabled"
  | "missing_configuration"
  | "timeout"
  | "provider_error"
  | "malformed_output"
  | "validation_rejection"
  | "benign_refusal"
  | "rate_limited";

/** Trusted envelope assembled only by application code after validation. */
export type TrustedOracleResponseV1 = Readonly<{
  schemaVersion: "1";
  requestId: string;
  cycleId: string;
  oracleId: OracleId;
  answer: string;
  source: "oracle-ai" | "protected-library" | "safety-system";
  presentation: OracleIntelligencePresentation;
  safety: Readonly<{
    category: IntelligenceSafetyCategory;
    fallbackAllowed: boolean;
  }>;
  fallback: Readonly<{
    used: boolean;
    reason?: FallbackReason;
  }>;
}>;

export type ValidationFailure = Readonly<{
  ok: false;
  kind: "validation_failure";
  issues: readonly string[];
}>;
export type ValidationSuccess = Readonly<{
  ok: true;
  value: ProviderOracleOutputV1;
}>;
export type ProviderOutputValidation = ValidationSuccess | ValidationFailure;

export type RequestValidation =
  | Readonly<{ ok: true; value: OracleIntelligenceRequestV1 }>
  | ValidationFailure;
