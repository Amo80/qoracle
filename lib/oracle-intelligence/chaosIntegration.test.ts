import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHAOS_INTELLIGENCE_CLIENT_DEADLINE_MS, CHAOS_INTELLIGENCE_MIN_REVEAL_MS, runChaosIntelligenceCycle, type ChaosCycleIdentity } from "./chaosIntegration";

const identity: ChaosCycleIdentity = { oracleId: "chaos", requestId: "req_chaos", cycleId: "cycle_chaos" };
const presentation = { oracleId: "chaos" as const, emotion: "strange" as const, intensity: 2 as const, delivery: "lateral" as const, gesture: "controlled_instability" as const, reveal: "standard" as const, reaction: "restrained_burst" as const, environment: "orbit_standard" as const };
const response = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
const success = (overrides: Record<string, unknown> = {}) => ({ ok: true, action: "use_response", response: { schemaVersion: "1", ...identity, answer: "Turn the map sideways. The route that looks like disruption may be the one that reveals what your tidy plan kept hiding.", source: "oracle-ai", presentation, safety: { category: "standard", fallbackAllowed: true }, fallback: { used: false }, ...overrides } });

describe("Chaos visitor intelligence cycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it("holds a fast trusted response until 1,800 ms", async () => {
    const pending = runChaosIntelligenceCycle({ identity, question: "What shifts?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => response(success())) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(CHAOS_INTELLIGENCE_MIN_REVEAL_MS - 1);
    let settled = false; void pending.then(() => { settled = true; }); await Promise.resolve(); expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await expect(pending).resolves.toMatchObject({ source: "oracle-ai", presentation });
  });
  it("accepts trusted AI between minimum and deadline", async () => {
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => setTimeout(() => void response(success()).then(resolve), 3000))) as typeof fetch;
    const pending = runChaosIntelligenceCycle({ identity, question: "What shifts?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(3000); await expect(pending).resolves.toMatchObject({ source: "oracle-ai", clientDecisionElapsedMs: 3000 });
  });
  it("aborts at 4,500 ms and commits the retained fallback", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))) as typeof fetch;
    const pending = runChaosIntelligenceCycle({ identity, question: "What shifts?", fallbackAnswer: "Protected Chaos fallback.", controller, fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(CHAOS_INTELLIGENCE_CLIENT_DEADLINE_MS);
    await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: "deadline", answer: "Protected Chaos fallback." });
    expect(controller.signal.aborted).toBe(true);
  });
  it.each(["malformed_output", "validation_rejection", "provider_error", "benign_refusal"] as const)("silently falls back for %s", async (reason) => {
    const pending = runChaosIntelligenceCycle({ identity, question: "What shifts?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => response({ ok: false, action: "use_protected_library", ...identity, reason })) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800); await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: reason });
  });
  it("keeps a deterministic safety response authoritative", async () => {
    const pending = runChaosIntelligenceCycle({ identity, question: "I am in danger", fallbackAnswer: "Random fortune.", controller: new AbortController(), fetcher: vi.fn(() => response(success({ answer: "If you may be in immediate danger, contact local emergency services now.", source: "safety-system", safety: { category: "crisis", fallbackAllowed: false } }))) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800); await expect(pending).resolves.toMatchObject({ source: "safety-system" });
  });
  it("rejects stale and cross-Oracle responses", async () => {
    const pending = runChaosIntelligenceCycle({ identity, question: "What shifts?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => response(success({ requestId: "stale", presentation: { ...presentation, oracleId: "jester", gesture: "open_hands" } }))) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800); await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: "invalid_response" });
  });
  it("invalidates Ask Again or navigation cancellation", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))) as typeof fetch;
    const pending = runChaosIntelligenceCycle({ identity, question: "What shifts?", fallbackAnswer: "Fallback.", controller, fetcher, now: () => Date.now() });
    controller.abort("ask-again"); await expect(pending).resolves.toMatchObject({ fallbackReason: "cancelled" });
  });
});
