import { describe, expect, it } from "vitest";
import type { OracleIntelligenceProvider } from "./provider";
import { generateWithTimeout, ORACLE_INTELLIGENCE_TIMEOUT_MS } from "./timeout";

const request = { schemaVersion: "1", requestId: "request_1", cycleId: "cycle_1", oracleId: "jester", question: "What now?" } as const;

describe("Oracle provider timeout and cancellation", () => {
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
});
