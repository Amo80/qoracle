import type { OracleIntelligenceRequestV1, ProviderOracleOutputV1 } from "./types";

export type ProviderFailureKind =
  | "timeout"
  | "provider_error"
  | "refusal"
  | "malformed_output"
  | "cancelled";

export type ProviderResult =
  | Readonly<{ ok: true; output: ProviderOracleOutputV1 }>
  | Readonly<{ ok: false; kind: ProviderFailureKind; safetyCategory?: "standard" | "crisis" | "refusal" }>;

export interface OracleIntelligenceProvider {
  generate(request: OracleIntelligenceRequestV1, signal: AbortSignal): Promise<ProviderResult>;
}

export function cancelledResult(): ProviderResult {
  return { ok: false, kind: "cancelled" };
}
