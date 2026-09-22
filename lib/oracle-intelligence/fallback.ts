import type { FallbackReason, IntelligenceSafetyCategory } from "./types";
import { decideSafetyPolicy } from "./safety";

export type IntelligenceOutcome =
  | "disabled"
  | "missing_configuration"
  | "success"
  | "timeout"
  | "provider_error"
  | "malformed_output"
  | "validation_rejection"
  | "benign_refusal"
  | "rate_limited"
  | "safety_refusal"
  | "crisis"
  | "superseded";

export type FallbackDecision =
  | Readonly<{ action: "use_ai" }>
  | Readonly<{ action: "use_protected_library"; reason: FallbackReason }>
  | Readonly<{ action: "use_safety_response"; category: IntelligenceSafetyCategory }>
  | Readonly<{ action: "discard_superseded" }>;

export function decideFallback(outcome: IntelligenceOutcome): FallbackDecision {
  if (outcome === "success") return { action: "use_ai" };
  if (outcome === "superseded") return { action: "discard_superseded" };
  if (outcome === "crisis") return { action: "use_safety_response", category: "crisis" };
  if (outcome === "safety_refusal") return { action: "use_safety_response", category: "refusal" };
  return { action: "use_protected_library", reason: outcome };
}

export function fallbackAllowedForSafety(category: IntelligenceSafetyCategory) {
  return decideSafetyPolicy(category).fallbackAllowed;
}
