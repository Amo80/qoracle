import { afterEach, describe, expect, it, vi } from "vitest";
import type { OracleIntelligenceProvider } from "./provider";
import {
  generateWithQualificationTimeout,
  generateWithTimeout,
  ORACLE_INTELLIGENCE_QUALIFICATION_TIMEOUT_MS,
  ORACLE_INTELLIGENCE_TIMEOUT_MS,
} from "./timeout";

const request = { schemaVersion: "1", requestId: "request_1", cycleId: "cycle_1", oracleId: "jester", question: "What now?" } as const;

describe("Oracle provider timeout and cancellation", () => {
  afterEach(() => vi.useRealTimers());
  it("times out and aborts a provider that does not settle", async () => {
    let aborted = false;
    const provider: OracleIntelligenceProvider = { generate: async (_request, signal) => new Promise((resolve) => {
      signal.addEventListener("abort", () => { aborted = true; resolve({ ok: false, kind: "cancelled" }); }, { once: true });
    }) };
    await expect(generateWithTimeout({ provider, request, timeoutMs: 5 })).resolves.toEqual({ ok: false, kind: "timeout" });
    expect(aborted).toBe(true);
    expect(ORACLE_INTELLIGENCE_TIMEOUT_MS).toBeLessThan(1800);
  });

  it("propagates parent cancellation", async () => {
    const controller = new AbortController();
    const provider: OracleIntelligenceProvider = { generate: async (_request, signal) => new Promise((resolve) => {
      signal.addEventListener("abort", () => resolve({ ok: false, kind: "cancelled" }), { once: true });
    }) };
    const pending = generateWithTimeout({ provider, request, parentSignal: controller.signal });
    controller.abort();
    await expect(pending).resolves.toEqual({ ok: false, kind: "cancelled" });
  });

  it("keeps the normal route capped at 1,550 ms and qualification capped at 5,000 ms", async () => {
    vi.useFakeTimers();
    const provider: OracleIntelligenceProvider = { generate: async (_request, signal) => new Promise((resolve) => {
      signal.addEventListener("abort", () => resolve({ ok: false, kind: "cancelled" }), { once: true });
    }) };
    const normal = generateWithTimeout({ provider, request, timeoutMs: 99_999 });
    await vi.advanceTimersByTimeAsync(ORACLE_INTELLIGENCE_TIMEOUT_MS - 1);
    let normalSettled = false;
    void normal.then(() => { normalSettled = true; });
    await Promise.resolve();
    expect(normalSettled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(normal).resolves.toEqual({ ok: false, kind: "timeout" });

    const qualification = generateWithQualificationTimeout({ provider, request, timeoutMs: 99_999 });
    await vi.advanceTimersByTimeAsync(ORACLE_INTELLIGENCE_QUALIFICATION_TIMEOUT_MS - 1);
    let qualificationSettled = false;
    void qualification.then(() => { qualificationSettled = true; });
    await Promise.resolve();
    expect(qualificationSettled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(qualification).resolves.toEqual({ ok: false, kind: "timeout" });
  });
});
