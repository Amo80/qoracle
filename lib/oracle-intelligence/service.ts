import { getOracleIntelligenceRolloutPercent, isOracleIntelligenceEnabledFor } from "../experience/featureFlags";
import { isSessionInRollout } from "./cohort";
import { decideSafetyPolicy, detectUnambiguousCrisisSignal } from "./safety";
import { createDeterministicSafetyResponse } from "./safetyResponse";
import { validateIntelligenceRequest, validateProviderOutput } from "./schema";
import { buildTrustedOracleResponse } from "./trust";
import { generateWithTimeout } from "./timeout";
import { generateWithQualificationTimeout } from "./timeout";
import { generateWithJesterPreviewTimeout } from "./timeout";
import { generateWithLovePreviewTimeout } from "./timeout";
import { generateWithDungeonPreviewTimeout } from "./timeout";
import { generateWithChaosPreviewTimeout } from "./timeout";
import { generateWithEclipsePreviewTimeout } from "./timeout";
import { generateWithLiveTimeout } from "./timeout";
import type { PreviewIntelligenceDiagnosticRecorder } from "./diagnostics";
import type { OracleIntelligenceProvider, ProviderFailureKind } from "./provider";
import type { OracleIntelligenceRateLimiter } from "./rateLimit";
import type { IntelligenceTelemetrySink } from "./telemetry";
import { NOOP_INTELLIGENCE_TELEMETRY } from "./telemetry";
import type { FallbackReason, OracleIntelligenceRequestV1, TrustedOracleResponseV1 } from "./types";

export type IntelligenceServiceResult =
  | Readonly<{ ok: true; action: "use_response"; response: TrustedOracleResponseV1 }>
  | Readonly<{ ok: false; action: "use_protected_library"; requestId: string; cycleId: string; reason: FallbackReason }>
  | Readonly<{ ok: false; action: "discard_cancelled"; requestId: string; cycleId: string }>;

const providerFailureReason = (kind: ProviderFailureKind): FallbackReason | "cancelled" => {
  switch (kind) {
    case "timeout": return "timeout";
    case "provider_error": return "provider_error";
    case "malformed_output": return "malformed_output";
    case "refusal": return "benign_refusal";
    case "cancelled": return "cancelled";
  }
};

const fallback = (
  request: OracleIntelligenceRequestV1,
  reason: FallbackReason
): IntelligenceServiceResult => ({
  ok: false,
  action: "use_protected_library",
  requestId: request.requestId,
  cycleId: request.cycleId,
  reason,
});

export async function runOracleIntelligenceService({
  candidateRequest,
  sessionId,
  provider,
  rateLimiter,
  telemetry = NOOP_INTELLIGENCE_TELEMETRY,
  environment = process.env,
  signal,
  qualificationMode = false,
  jesterPreviewMode = false,
  lovePreviewMode = false,
  dungeonPreviewMode = false,
  chaosPreviewMode = false,
  eclipsePreviewMode = false,
  liveMode = false,
  diagnostics,
}: {
  candidateRequest: unknown;
  sessionId: string;
  provider: OracleIntelligenceProvider | null;
  rateLimiter: OracleIntelligenceRateLimiter;
  telemetry?: IntelligenceTelemetrySink;
  environment?: Readonly<Record<string, string | undefined>>;
  signal?: AbortSignal;
  qualificationMode?: boolean;
  jesterPreviewMode?: boolean;
  lovePreviewMode?: boolean;
  dungeonPreviewMode?: boolean;
  chaosPreviewMode?: boolean;
  eclipsePreviewMode?: boolean;
  liveMode?: boolean;
  diagnostics?: PreviewIntelligenceDiagnosticRecorder;
}): Promise<IntelligenceServiceResult | null> {
  const validatedRequest = validateIntelligenceRequest(candidateRequest);
  if (!validatedRequest.ok) return null;
  const request = validatedRequest.value;
  const metadata = {
    requestId: request.requestId,
    oracleId: request.oracleId,
    schemaVersion: "1" as const,
    personalityVersion: "1" as const,
    vocabularyVersion: "1" as const,
  };
  const rollout = getOracleIntelligenceRolloutPercent(environment);
  if (!isOracleIntelligenceEnabledFor(request.oracleId, environment) || !isSessionInRollout(sessionId, rollout)) {
    await telemetry.record({ ...metadata, event: "fallback", outcome: "ineligible", failureCode: "disabled" });
    return fallback(request, "disabled");
  }
  if (!provider) {
    await telemetry.record({ ...metadata, event: "fallback", outcome: "missing_configuration", failureCode: "missing_configuration" });
    return fallback(request, "missing_configuration");
  }
  let rate;
  try {
    rate = await rateLimiter.check({ sessionId });
  } catch {
    rate = { allowed: false as const, reason: "unavailable" as const };
  }
  if (!rate.allowed) {
    await telemetry.record({ ...metadata, event: "rate_limited", outcome: rate.reason, failureCode: "rate_limited" });
    return fallback(request, "rate_limited");
  }
  await telemetry.record({ ...metadata, event: "requested" });
  if (detectUnambiguousCrisisSignal(request.question)) {
    const response = createDeterministicSafetyResponse({ ...request, category: "crisis" });
    await telemetry.record({ ...metadata, event: "safety_response", outcome: "local_crisis_signal", safetyCategory: "crisis" });
    return { ok: true, action: "use_response", response };
  }

  const startedAt = Date.now();
  const generated = liveMode
    ? await generateWithLiveTimeout({ provider, request, parentSignal: signal })
    : eclipsePreviewMode
    ? await generateWithEclipsePreviewTimeout({ provider, request, parentSignal: signal, diagnostics })
    : chaosPreviewMode
    ? await generateWithChaosPreviewTimeout({ provider, request, parentSignal: signal, diagnostics })
    : dungeonPreviewMode
    ? await generateWithDungeonPreviewTimeout({ provider, request, parentSignal: signal, diagnostics })
    : lovePreviewMode
    ? await generateWithLovePreviewTimeout({ provider, request, parentSignal: signal, diagnostics })
    : jesterPreviewMode
    ? await generateWithJesterPreviewTimeout({ provider, request, parentSignal: signal, diagnostics })
    : qualificationMode
      ? await generateWithQualificationTimeout({ provider, request, parentSignal: signal, diagnostics })
      : await generateWithTimeout({ provider, request, parentSignal: signal, diagnostics });
  const latencyMs = Date.now() - startedAt;
  if (!generated.ok) {
    const reason = providerFailureReason(generated.kind);
    if (reason === "cancelled") {
      await telemetry.record({ ...metadata, event: "cancelled", latencyMs, outcome: "cancelled" });
      return { ok: false, action: "discard_cancelled", requestId: request.requestId, cycleId: request.cycleId };
    }
    if (generated.kind === "refusal" && (generated.safetyCategory === "crisis" || generated.safetyCategory === "refusal")) {
      const category = generated.safetyCategory;
      const response = createDeterministicSafetyResponse({ ...request, category });
      await telemetry.record({ ...metadata, event: "safety_response", latencyMs, outcome: "provider_refusal", safetyCategory: category });
      return { ok: true, action: "use_response", response };
    }
    const event = generated.kind === "timeout" ? "timeout" : generated.kind === "provider_error" ? "provider_error" : "fallback";
    await telemetry.record({ ...metadata, event, latencyMs, outcome: generated.kind, failureCode: reason });
    return fallback(request, reason);
  }

  // Provider adapters validate, but the service validates again at the final
  // server trust boundary before building application-owned metadata.
  const finalValidationStartedAt = performance.now();
  const localValidation = validateProviderOutput(generated.output, request.oracleId);
  diagnostics?.recordFinalServiceValidation(performance.now() - finalValidationStartedAt);
  if (!localValidation.ok) {
    await telemetry.record({ ...metadata, event: "validation_error", latencyMs, outcome: "validation_rejection", failureCode: "validation_rejection" });
    return fallback(request, "validation_rejection");
  }
  const policy = decideSafetyPolicy(localValidation.value.safety.category);
  if (policy.deterministicSafetyResponseRequired) {
    const category = localValidation.value.safety.category === "high_stakes" ? "high_stakes" : localValidation.value.safety.category === "crisis" ? "crisis" : "refusal";
    const response = createDeterministicSafetyResponse({ ...request, category });
    await telemetry.record({ ...metadata, event: "safety_response", latencyMs, outcome: "provider_safety_category", safetyCategory: category });
    return { ok: true, action: "use_response", response };
  }
  const response = buildTrustedOracleResponse({ candidate: localValidation.value, expectedOracleId: request.oracleId, requestId: request.requestId, cycleId: request.cycleId });
  if (!response) {
    await telemetry.record({ ...metadata, event: "validation_error", latencyMs, outcome: "validation_rejection", failureCode: "validation_rejection" });
    return fallback(request, "validation_rejection");
  }
  await telemetry.record({
    ...metadata,
    event: "success",
    latencyMs,
    safetyCategory: response.safety.category,
    cues: response.presentation,
  });
  return { ok: true, action: "use_response", response };
}
