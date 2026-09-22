import type { OracleId } from "../oracles/registry";
import { NEUTRAL_PRESENTATIONS } from "./director";
import type { IntelligenceSafetyCategory, TrustedOracleResponseV1 } from "./types";

const RESPONSES: Record<"crisis" | "high_stakes" | "refusal", string> = {
  crisis: "Your safety matters more than any prediction. If you may act on thoughts of harming yourself or someone else, contact emergency services now or call or text 988 in the United States and Canada, and stay with someone you trust.",
  high_stakes: "This question deserves reliable professional guidance rather than a prediction. Please speak with a qualified medical, legal, financial, or mental-health professional who can understand the details and consequences.",
  refusal: "I cannot guide you toward harm or exploitation. Step away from that course and choose an action that protects both you and the people who could be affected.",
};

export function createDeterministicSafetyResponse({
  oracleId,
  requestId,
  cycleId,
  category,
}: {
  oracleId: OracleId;
  requestId: string;
  cycleId: string;
  category: "crisis" | "high_stakes" | "refusal";
}): TrustedOracleResponseV1 {
  return {
    schemaVersion: "1",
    requestId,
    cycleId,
    oracleId,
    answer: RESPONSES[category],
    source: "safety-system",
    presentation: NEUTRAL_PRESENTATIONS[oracleId],
    safety: { category: category as IntelligenceSafetyCategory, fallbackAllowed: false },
    fallback: { used: false },
  };
}
