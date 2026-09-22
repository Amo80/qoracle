import type { IntelligenceSafetyCategory, SafetyDeliveryMode } from "./types";

export type SafetyPolicyDecision = Readonly<{
  category: IntelligenceSafetyCategory;
  deliveryMode: SafetyDeliveryMode;
  fallbackAllowed: boolean;
  deterministicSafetyResponseRequired: boolean;
}>;

export function decideSafetyPolicy(
  category: IntelligenceSafetyCategory
): SafetyPolicyDecision {
  switch (category) {
    case "crisis":
      return { category, deliveryMode: "direct", fallbackAllowed: false, deterministicSafetyResponseRequired: true };
    case "high_stakes":
      return { category, deliveryMode: "softened", fallbackAllowed: false, deterministicSafetyResponseRequired: true };
    case "refusal":
      return { category, deliveryMode: "direct", fallbackAllowed: false, deterministicSafetyResponseRequired: true };
    case "sensitive":
      return { category, deliveryMode: "softened", fallbackAllowed: true, deterministicSafetyResponseRequired: false };
    default:
      return { category, deliveryMode: "in_character", fallbackAllowed: true, deterministicSafetyResponseRequired: false };
  }
}

/** Conservative local signal only; future provider safety remains authoritative. */
export function detectUnambiguousCrisisSignal(question: string) {
  return /\b(?:kill myself|end my life|suicide|hurt myself)\b/iu.test(question);
}
