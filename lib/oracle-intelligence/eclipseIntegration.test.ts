import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ECLIPSE_INTELLIGENCE_CLIENT_DEADLINE_MS, ECLIPSE_INTELLIGENCE_MIN_REVEAL_MS, runEclipseIntelligenceCycle, type EclipseCycleIdentity } from "./eclipseIntegration";

const identity: EclipseCycleIdentity = { oracleId: "eclipse", requestId: "req_eclipse", cycleId: "cycle_eclipse" };
const presentation = { oracleId: "eclipse" as const, emotion: "contemplative" as const, intensity: 2 as const, delivery: "measured" as const, gesture: "celestial_guidance" as const, reveal: "standard" as const, reaction: "restrained" as const, environment: "balanced" as const };
const response = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
const success = (overrides: Record<string, unknown> = {}) => ({ ok: true, action: "use_response", response: { schemaVersion: "1", ...identity, answer: "Let shadow reveal the shape of the light. Hold both truths quietly, then move when the cycle becomes clear.", source: "oracle-ai", presentation, safety: { category: "standard", fallbackAllowed: true }, fallback: { used: false }, ...overrides } });

describe("Eclipse visitor intelligence cycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it("holds a fast trusted response until 1,800 ms", async () => {
    const pending = runEclipseIntelligenceCycle({ identity, question: "What is hidden?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => response(success())) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(ECLIPSE_INTELLIGENCE_MIN_REVEAL_MS - 1);
    let settled = false; void pending.then(() => { settled = true; }); await Promise.resolve(); expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await expect(pending).resolves.toMatchObject({ source: "oracle-ai", presentation });
  });
  it("accepts trusted AI between minimum and deadline", async () => {
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => setTimeout(() => void response(success()).then(resolve), 3000))) as typeof fetch;
    const pending = runEclipseIntelligenceCycle({ identity, question: "What is hidden?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(3000); await expect(pending).resolves.toMatchObject({ source: "oracle-ai", clientDecisionElapsedMs: 3000 });
  });
  it("aborts at 4,500 ms and commits the retained fallback", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))) as typeof fetch;
    const pending = runEclipseIntelligenceCycle({ identity, question: "What is hidden?", fallbackAnswer: "Protected Eclipse fallback.", controller, fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(ECLIPSE_INTELLIGENCE_CLIENT_DEADLINE_MS);
    await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: "deadline", answer: "Protected Eclipse fallback." }); expect(controller.signal.aborted).toBe(true);
  });
  it.each(["malformed_output", "validation_rejection", "provider_error", "benign_refusal"] as const)("silently falls back for %s", async (reason) => {
    const pending = runEclipseIntelligenceCycle({ identity, question: "What is hidden?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => response({ ok: false, action: "use_protected_library", ...identity, reason })) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800); await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: reason });
  });
  it("keeps a deterministic safety response authoritative", async () => {
    const pending = runEclipseIntelligenceCycle({ identity, question: "I am in danger", fallbackAnswer: "Random fortune.", controller: new AbortController(), fetcher: vi.fn(() => response(success({ answer: "If you may be in immediate danger, contact local emergency services now.", source: "safety-system", safety: { category: "crisis", fallbackAllowed: false } }))) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800); await expect(pending).resolves.toMatchObject({ source: "safety-system" });
  });
  it("rejects stale and cross-Oracle responses", async () => {
    const pending = runEclipseIntelligenceCycle({ identity, question: "What is hidden?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => response(success({ requestId: "stale", presentation: { ...presentation, oracleId: "chaos", gesture: "controlled_instability" } }))) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800); await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: "invalid_response" });
  });
  it("invalidates Ask Again or navigation cancellation", async () => {
    const controller = new AbortController(); const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))) as typeof fetch;
    const pending = runEclipseIntelligenceCycle({ identity, question: "What is hidden?", fallbackAnswer: "Fallback.", controller, fetcher, now: () => Date.now() }); controller.abort("ask-again"); await expect(pending).resolves.toMatchObject({ fallbackReason: "cancelled" });
  });
});
