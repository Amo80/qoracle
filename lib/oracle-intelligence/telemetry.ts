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
