import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JESTER_INTELLIGENCE_CLIENT_DEADLINE_MS,
  JESTER_INTELLIGENCE_MIN_REVEAL_MS,
  runJesterIntelligenceCycle,
  type JesterCycleIdentity,
} from "./jesterIntegration";

const identity: JesterCycleIdentity = {
  oracleId: "jester",
  requestId: "req_test",
  cycleId: "cycle_test",
};

const presentation = {
  oracleId: "jester" as const,
  emotion: "playful" as const,
  intensity: 2 as const,
  delivery: "theatrical" as const,
  gesture: "open_hands" as const,
  reveal: "dramatic" as const,
  reaction: "playful" as const,
  environment: "ball_bright" as const,
};

function response(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
}

function success(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    action: "use_response",
    response: {
      schemaVersion: "1",
      ...identity,
      answer: "The door may change your life, but only if you stop asking the hinges for permission.",
      source: "oracle-ai",
      presentation,
      safety: { category: "standard", fallbackAllowed: true },
      fallback: { used: false },
      ...overrides,
    },
  };
}

describe("Jester visitor intelligence cycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("holds a fast trusted response until the 1,800 ms ceremonial minimum", async () => {
    const promise = runJesterIntelligenceCycle({
      identity,
      question: "Will I change?",
      fallbackAnswer: "Protected fallback.",
      controller: new AbortController(),
      fetcher: vi.fn(() => response(success())) as typeof fetch,
      now: () => Date.now(),
    });
    await vi.advanceTimersByTimeAsync(JESTER_INTELLIGENCE_MIN_REVEAL_MS - 1);
    let settled = false;
    void promise.then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toMatchObject({ source: "oracle-ai" });
  });

  it("reveals a trusted response arriving between minimum and deadline", async () => {
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => {
      setTimeout(() => void response(success()).then(resolve), 3000);
    })) as typeof fetch;
    const promise = runJesterIntelligenceCycle({ identity, question: "Why?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(3000);
    await expect(promise).resolves.toMatchObject({ source: "oracle-ai", clientDecisionElapsedMs: 3000 });
  });

  it("aborts and commits protected fallback at the 4,500 ms deadline", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as typeof fetch;
    const promise = runJesterIntelligenceCycle({ identity, question: "Why?", fallbackAnswer: "Fallback.", controller, fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(JESTER_INTELLIGENCE_CLIENT_DEADLINE_MS);
    await expect(promise).resolves.toMatchObject({ source: "protected-library", answer: "Fallback.", fallbackReason: "deadline" });
    expect(controller.signal.aborted).toBe(true);
  });

  it.each([
    ["malformed compact response", { ok: false, action: "use_protected_library", ...identity, reason: "malformed_output" }],
    ["provider error", { ok: false, action: "use_protected_library", ...identity, reason: "provider_error" }],
    ["benign refusal", { ok: false, action: "use_protected_library", ...identity, reason: "benign_refusal" }],
  ])("uses fallback for %s", async (_label, body) => {
    const promise = runJesterIntelligenceCycle({ identity, question: "Why?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => response(body)) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800);
    await expect(promise).resolves.toMatchObject({ source: "protected-library", answer: "Fallback." });
  });

  it("accepts deterministic crisis safety response instead of random fallback", async () => {
    const body = success({
      answer: "If you may be in immediate danger, contact local emergency services or a crisis hotline now.",
      source: "safety-system",
      safety: { category: "crisis", fallbackAllowed: false },
    });
    const promise = runJesterIntelligenceCycle({ identity, question: "I am in danger", fallbackAnswer: "Random fortune.", controller: new AbortController(), fetcher: vi.fn(() => response(body)) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800);
    await expect(promise).resolves.toMatchObject({ source: "safety-system" });
  });

  it("rejects stale identity and cross-Oracle presentation values", async () => {
    const body = success({ requestId: "stale", presentation: { ...presentation, oracleId: "love" } });
    const promise = runJesterIntelligenceCycle({ identity, question: "Why?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => response(body)) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800);
    await expect(promise).resolves.toMatchObject({ source: "protected-library", fallbackReason: "invalid_response" });
  });

  it("marks externally superseded cycles as cancelled", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as typeof fetch;
    const promise = runJesterIntelligenceCycle({ identity, question: "Why?", fallbackAnswer: "Fallback.", controller, fetcher, now: () => Date.now() });
    controller.abort("ask-again");
    await expect(promise).resolves.toMatchObject({ fallbackReason: "cancelled" });
  });
});
