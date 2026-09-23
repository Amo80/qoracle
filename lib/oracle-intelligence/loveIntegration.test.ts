import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LOVE_INTELLIGENCE_CLIENT_DEADLINE_MS,
  LOVE_INTELLIGENCE_MIN_REVEAL_MS,
  runLoveIntelligenceCycle,
  type LoveCycleIdentity,
} from "./loveIntegration";

const identity: LoveCycleIdentity = { oracleId: "love", requestId: "req_love", cycleId: "cycle_love" };
const presentation = {
  oracleId: "love" as const,
  emotion: "warm" as const,
  intensity: 2 as const,
  delivery: "tender" as const,
  gesture: "gentle_present" as const,
  reveal: "standard" as const,
  reaction: "warm" as const,
  environment: "heart_standard" as const,
};

const jsonResponse = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), {
  status: 200,
  headers: { "Content-Type": "application/json" },
}));
const success = (overrides: Record<string, unknown> = {}) => ({
  ok: true,
  action: "use_response",
  response: {
    schemaVersion: "1",
    ...identity,
    answer: "Love grows where honesty and tenderness meet; notice whether this bond gives both of you room to be fully yourselves.",
    source: "oracle-ai",
    presentation,
    safety: { category: "standard", fallbackAllowed: true },
    fallback: { used: false },
    ...overrides,
  },
});

describe("Love visitor intelligence cycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("holds fast trusted Love responses until 1,800 ms", async () => {
    const pending = runLoveIntelligenceCycle({ identity, question: "Is this love?", fallbackAnswer: "Protected Love fallback.", controller: new AbortController(), fetcher: vi.fn(() => jsonResponse(success())) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(LOVE_INTELLIGENCE_MIN_REVEAL_MS - 1);
    let settled = false;
    void pending.then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ source: "oracle-ai", presentation });
  });

  it("accepts a trusted Love response between minimum and deadline", async () => {
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => {
      setTimeout(() => void jsonResponse(success()).then(resolve), 3000);
    })) as typeof fetch;
    const pending = runLoveIntelligenceCycle({ identity, question: "Is this love?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(3000);
    await expect(pending).resolves.toMatchObject({ source: "oracle-ai", clientDecisionElapsedMs: 3000 });
  });

  it("aborts and commits protected Love fallback at 4,500 ms", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as typeof fetch;
    const pending = runLoveIntelligenceCycle({ identity, question: "Is this love?", fallbackAnswer: "Protected Love fallback.", controller, fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(LOVE_INTELLIGENCE_CLIENT_DEADLINE_MS);
    await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: "deadline", answer: "Protected Love fallback." });
    expect(controller.signal.aborted).toBe(true);
  });

  it.each(["malformed_output", "validation_rejection", "provider_error", "benign_refusal"] as const)(
    "silently falls back for %s",
    async (reason) => {
      const pending = runLoveIntelligenceCycle({ identity, question: "Is this love?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => jsonResponse({ ok: false, action: "use_protected_library", ...identity, reason })) as typeof fetch, now: () => Date.now() });
      await vi.advanceTimersByTimeAsync(1800);
      await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: reason });
    }
  );

  it("keeps deterministic safety response authoritative", async () => {
    const pending = runLoveIntelligenceCycle({ identity, question: "I am in danger", fallbackAnswer: "Random fortune.", controller: new AbortController(), fetcher: vi.fn(() => jsonResponse(success({ answer: "If you may be in immediate danger, contact local emergency services or a crisis hotline now.", source: "safety-system", safety: { category: "crisis", fallbackAllowed: false } }))) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800);
    await expect(pending).resolves.toMatchObject({ source: "safety-system" });
  });

  it("rejects stale identities and non-Love presentation vocabularies", async () => {
    const pending = runLoveIntelligenceCycle({ identity, question: "Is this love?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => jsonResponse(success({ requestId: "stale", presentation: { ...presentation, oracleId: "jester", gesture: "open_hands" } }))) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800);
    await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: "invalid_response" });
  });

  it("invalidates an externally superseded Ask Again/navigation cycle", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as typeof fetch;
    const pending = runLoveIntelligenceCycle({ identity, question: "Is this love?", fallbackAnswer: "Fallback.", controller, fetcher, now: () => Date.now() });
    controller.abort("ask-again");
    await expect(pending).resolves.toMatchObject({ fallbackReason: "cancelled" });
  });
});
