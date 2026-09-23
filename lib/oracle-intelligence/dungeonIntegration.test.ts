import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DUNGEON_INTELLIGENCE_CLIENT_DEADLINE_MS,
  DUNGEON_INTELLIGENCE_MIN_REVEAL_MS,
  runDungeonIntelligenceCycle,
  type DungeonCycleIdentity,
} from "./dungeonIntegration";

const identity: DungeonCycleIdentity = { oracleId: "dnd", requestId: "req_dungeon", cycleId: "cycle_dungeon" };
const presentation = {
  oracleId: "dnd" as const,
  emotion: "watchful" as const,
  intensity: 2 as const,
  delivery: "measured" as const,
  gesture: "guardian_focus" as const,
  reveal: "standard" as const,
  reaction: "restrained" as const,
  environment: "d20_standard" as const,
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
    answer: "A worthy trial asks for courage and preparation, not blind haste. Study the cost, gather what you need, then choose the gate you can cross with purpose.",
    source: "oracle-ai",
    presentation,
    safety: { category: "standard", fallbackAllowed: true },
    fallback: { used: false },
    ...overrides,
  },
});

describe("Dungeon visitor intelligence cycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("holds fast trusted Dungeon responses until 1,800 ms", async () => {
    const pending = runDungeonIntelligenceCycle({ identity, question: "Is this trial worth accepting?", fallbackAnswer: "Protected Dungeon fallback.", controller: new AbortController(), fetcher: vi.fn(() => jsonResponse(success())) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(DUNGEON_INTELLIGENCE_MIN_REVEAL_MS - 1);
    let settled = false;
    void pending.then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ source: "oracle-ai", presentation });
  });

  it("accepts a trusted Dungeon response between minimum and deadline", async () => {
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => {
      setTimeout(() => void jsonResponse(success()).then(resolve), 3000);
    })) as typeof fetch;
    const pending = runDungeonIntelligenceCycle({ identity, question: "Which path?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(3000);
    await expect(pending).resolves.toMatchObject({ source: "oracle-ai", clientDecisionElapsedMs: 3000 });
  });

  it("aborts and commits protected Dungeon fallback at 4,500 ms", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as typeof fetch;
    const pending = runDungeonIntelligenceCycle({ identity, question: "Which path?", fallbackAnswer: "Protected Dungeon fallback.", controller, fetcher, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(DUNGEON_INTELLIGENCE_CLIENT_DEADLINE_MS);
    await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: "deadline", answer: "Protected Dungeon fallback." });
    expect(controller.signal.aborted).toBe(true);
  });

  it.each(["malformed_output", "validation_rejection", "provider_error", "benign_refusal"] as const)(
    "silently falls back for %s",
    async (reason) => {
      const pending = runDungeonIntelligenceCycle({ identity, question: "Which path?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => jsonResponse({ ok: false, action: "use_protected_library", ...identity, reason })) as typeof fetch, now: () => Date.now() });
      await vi.advanceTimersByTimeAsync(1800);
      await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: reason });
    }
  );

  it("keeps deterministic safety response authoritative", async () => {
    const pending = runDungeonIntelligenceCycle({ identity, question: "I am in danger", fallbackAnswer: "Random fortune.", controller: new AbortController(), fetcher: vi.fn(() => jsonResponse(success({ answer: "If you may be in immediate danger, contact local emergency services or a crisis hotline now.", source: "safety-system", safety: { category: "crisis", fallbackAllowed: false } }))) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800);
    await expect(pending).resolves.toMatchObject({ source: "safety-system" });
  });

  it("rejects stale identities and non-Dungeon presentation vocabularies", async () => {
    const pending = runDungeonIntelligenceCycle({ identity, question: "Which path?", fallbackAnswer: "Fallback.", controller: new AbortController(), fetcher: vi.fn(() => jsonResponse(success({ requestId: "stale", presentation: { ...presentation, oracleId: "jester", gesture: "open_hands" } }))) as typeof fetch, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(1800);
    await expect(pending).resolves.toMatchObject({ source: "protected-library", fallbackReason: "invalid_response" });
  });

  it("invalidates an externally superseded Ask Again or navigation cycle", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as typeof fetch;
    const pending = runDungeonIntelligenceCycle({ identity, question: "Which path?", fallbackAnswer: "Fallback.", controller, fetcher, now: () => Date.now() });
    controller.abort("ask-again");
    await expect(pending).resolves.toMatchObject({ fallbackReason: "cancelled" });
  });
});
