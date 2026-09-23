import type { IntelligenceSafetyCategory } from "./types";

export type IntelligenceTelemetryEventName =
  | "requested"
  | "success"
  | "fallback"
  | "timeout"
  | "provider_error"
  | "validation_error"
  | "safety_response"
  | "rate_limited"
  | "cancelled";

export type IntelligenceTelemetryEvent = Readonly<{
  event: IntelligenceTelemetryEventName;
  requestId: string;
  oracleId: string;
  schemaVersion: "1";
  personalityVersion: "1";
  vocabularyVersion: "1";
  model?: string;
  latencyMs?: number;
  outcome?: string;
  failureCode?: string;
  safetyCategory?: IntelligenceSafetyCategory;
  cues?: Readonly<{ emotion: string; intensity: number; delivery: string; gesture: string; reveal: string; reaction: string; environment: string }>;
  inputTokens?: number;
  outputTokens?: number;
}>;

export interface IntelligenceTelemetrySink {
  record(event: IntelligenceTelemetryEvent): void | Promise<void>;
}

export const NOOP_INTELLIGENCE_TELEMETRY: IntelligenceTelemetrySink = {
  record() {},
};

export class MemoryIntelligenceTelemetry implements IntelligenceTelemetrySink {
  readonly events: IntelligenceTelemetryEvent[] = [];
  record(event: IntelligenceTelemetryEvent) {
    this.events.push(structuredClone(event));
  }
}

function latencyBucket(latencyMs: number | undefined) {
  if (latencyMs === undefined) return undefined;
  if (latencyMs < 1800) return "under_1800ms";
  if (latencyMs < 3000) return "1800_2999ms";
  if (latencyMs < 4250) return "3000_4249ms";
  return "4250ms_or_more";
}

/** Minimal privacy-safe operational telemetry for server logs. */
export class ProductionIntelligenceTelemetry implements IntelligenceTelemetrySink {
  record(event: IntelligenceTelemetryEvent) {
    console.info("[oracle-intelligence]", {
      event: event.event,
      oracleId: event.oracleId,
      outcome: event.outcome ?? null,
      failureCode: event.failureCode ?? null,
      safetyCategory: event.safetyCategory ?? null,
      latencyBucket: latencyBucket(event.latencyMs) ?? null,
    });
  }
}

export function createProductionIntelligenceTelemetry(
  environment: Readonly<Record<string, string | undefined>> = process.env
): IntelligenceTelemetrySink {
  return environment.VERCEL_ENV === "production"
    ? new ProductionIntelligenceTelemetry()
    : NOOP_INTELLIGENCE_TELEMETRY;
}
