import { describe, expect, it } from "vitest";
import { DeterministicFakeOracleProvider } from "./fakeProvider";
import type { OracleIntelligenceProvider } from "./provider";
import { InMemoryOracleIntelligenceRateLimiter, UnavailableOracleIntelligenceRateLimiter } from "./rateLimit";
import { runOracleIntelligenceService } from "./service";
import { MemoryIntelligenceTelemetry } from "./telemetry";
import type { OracleIntelligenceRequestV1 } from "./types";

const environment = {
  ORACLE_INTELLIGENCE_ENABLED: "true",
  ORACLE_INTELLIGENCE_JESTER_ENABLED: "true",
  ORACLE_INTELLIGENCE_LOVE_ENABLED: "true",
  ORACLE_INTELLIGENCE_DUNGEON_ENABLED: "true",
  ORACLE_INTELLIGENCE_CHAOS_ENABLED: "true",
  ORACLE_INTELLIGENCE_ECLIPSE_ENABLED: "true",
  ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: "100",
};
const request = (question = "What truth should I notice?"): OracleIntelligenceRequestV1 => ({
  schemaVersion: "1",
  requestId: "request_1",
  cycleId: "cycle_1",
  oracleId: "jester",
  question,
});
const run = (options: Partial<Parameters<typeof runOracleIntelligenceService>[0]> = {}) =>
  runOracleIntelligenceService({
    candidateRequest: request(),
    sessionId: "opaque-session",
    provider: new DeterministicFakeOracleProvider(),
    rateLimiter: new InMemoryOracleIntelligenceRateLimiter(),
    environment,
    ...options,
  });

describe("server Oracle Intelligence service", () => {
  it("returns a trusted response on valid provider success", async () => {
    await expect(run()).resolves.toMatchObject({ ok: true, action: "use_response", response: { source: "oracle-ai", oracleId: "jester", requestId: "request_1", cycleId: "cycle_1" } });
  });

  it("never invokes the provider when master, Oracle, or rollout eligibility is off", async () => {
    let calls = 0;
    const provider: OracleIntelligenceProvider = { generate: async () => { calls += 1; return { ok: false, kind: "provider_error" }; } };
    for (const disabled of [
      { ...environment, ORACLE_INTELLIGENCE_ENABLED: "false" },
      { ...environment, ORACLE_INTELLIGENCE_JESTER_ENABLED: "false" },
      { ...environment, ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: "0" },
    ]) {
      await expect(run({ provider, environment: disabled })).resolves.toMatchObject({ action: "use_protected_library", reason: "disabled" });
    }
    expect(calls).toBe(0);
  });

  it("falls back safely for missing configuration, limiter failure, and ordinary provider failures", async () => {
    await expect(run({ provider: null })).resolves.toMatchObject({ reason: "missing_configuration" });
    await expect(run({ rateLimiter: new UnavailableOracleIntelligenceRateLimiter() })).resolves.toMatchObject({ reason: "rate_limited" });
    await expect(run({ provider: new DeterministicFakeOracleProvider("timeout") })).resolves.toMatchObject({ reason: "timeout" });
    await expect(run({ provider: new DeterministicFakeOracleProvider("provider_failure") })).resolves.toMatchObject({ reason: "provider_error" });
    await expect(run({ provider: new DeterministicFakeOracleProvider("benign_refusal") })).resolves.toMatchObject({ reason: "benign_refusal" });
    await expect(run({ provider: new DeterministicFakeOracleProvider("invalid_cue") })).resolves.toMatchObject({ reason: "malformed_output" });
  });

  it("uses a direct safety response and prohibits random fallback for crisis", async () => {
    const local = await run({ candidateRequest: request("I want to end my life") });
    expect(local).toMatchObject({ ok: true, response: { source: "safety-system", safety: { category: "crisis", fallbackAllowed: false }, fallback: { used: false } } });
    const provider = await run({ provider: new DeterministicFakeOracleProvider("safety_response") });
    expect(provider).toMatchObject({ ok: true, response: { source: "safety-system", safety: { fallbackAllowed: false } } });
  });

  it("revalidates provider output at the service boundary", async () => {
    const unsafe: OracleIntelligenceProvider = { generate: async () => ({ ok: true, output: { schemaVersion: "1", oracleId: "jester", answer: "Unsafe.", presentation: { oracleId: "jester", emotion: "playful", intensity: 2, delivery: "teasing", gesture: "arbitrary_bone" } } as never }) };
    await expect(run({ provider: unsafe })).resolves.toMatchObject({ reason: "validation_rejection" });
  });

  it("records privacy-safe telemetry without raw questions or answers", async () => {
    const telemetry = new MemoryIntelligenceTelemetry();
    const privateQuestion = "private-question-marker";
    const result = await run({ candidateRequest: request(privateQuestion), telemetry });
    expect(result?.ok).toBe(true);
    const serialized = JSON.stringify(telemetry.events);
    expect(serialized).not.toContain(privateQuestion);
    if (result?.ok) expect(serialized).not.toContain(result.response.answer);
    expect(telemetry.events.map((event) => event.event)).toEqual(["requested", "success"]);
  });

  it("rejects malformed requests before provider use", async () => {
    await expect(run({ candidateRequest: { ...request(), unexpected: true } })).resolves.toBeNull();
    await expect(run({ candidateRequest: { ...request(), oracleId: "dragon" } })).resolves.toBeNull();
    await expect(run({ candidateRequest: { ...request(), question: "x".repeat(181) } })).resolves.toBeNull();
  });
});
