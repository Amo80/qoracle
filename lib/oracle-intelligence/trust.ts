import { normalizeClientPresentation, validateProviderOutput } from "./schema";
import { decideSafetyPolicy } from "./safety";
import type { OracleId } from "../oracles/registry";
import type { TrustedOracleResponseV1 } from "./types";

export function buildTrustedOracleResponse({
  candidate,
  expectedOracleId,
  requestId,
  cycleId,
}: {
  candidate: unknown;
  expectedOracleId: OracleId;
  requestId: string;
  cycleId: string;
}): TrustedOracleResponseV1 | null {
  const validated = validateProviderOutput(candidate, expectedOracleId);
  if (!validated.ok) return null;
  const safety = decideSafetyPolicy(validated.value.safety.category);
  return {
    schemaVersion: "1",
    requestId,
    cycleId,
    oracleId: expectedOracleId,
    answer: validated.value.answer.trim(),
    source: "oracle-ai",
    presentation: validated.value.presentation,
    safety: { category: safety.category, fallbackAllowed: safety.fallbackAllowed },
    fallback: { used: false },
  };
}

export function acceptTrustedPresentationOnClient(
  response: unknown,
  expectedOracleId: OracleId
) {
  if (!response || typeof response !== "object") return null;
  const record = response as Record<string, unknown>;
  if (record.schemaVersion !== "1" || record.oracleId !== expectedOracleId) return null;
  return normalizeClientPresentation(record.presentation, expectedOracleId);
}
