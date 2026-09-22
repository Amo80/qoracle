import { describe, expect, it } from "vitest";
import { DeterministicFakeOracleProvider, type FakeProviderFixture } from "./fakeProvider";
import type { OracleIntelligenceRequestV1 } from "./types";

const request = (oracleId: OracleIntelligenceRequestV1["oracleId"]): OracleIntelligenceRequestV1 => ({
  schemaVersion: "1",
  requestId: "request_1",
  cycleId: "cycle_1",
  oracleId,
  question: "What should I understand?",
});

describe("deterministic fake intelligence provider", () => {
  it.each(["jester", "love", "dnd", "chaos", "eclipse"] as const)("returns a valid deterministic %s fixture", async (oracleId) => {
    const result = await new DeterministicFakeOracleProvider().generate(request(oracleId), new AbortController().signal);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output.oracleId).toBe(oracleId);
  });

  it.each([
    ["provider_failure", "provider_error"],
    ["timeout", "timeout"],
    ["benign_refusal", "refusal"],
    ["safety_response", "refusal"],
    ["malformed", "malformed_output"],
    ["wrong_oracle", "malformed_output"],
    ["oversized_answer", "malformed_output"],
    ["invalid_cue", "malformed_output"],
  ] as const)("normalizes %s", async (fixture, kind) => {
    const result = await new DeterministicFakeOracleProvider(fixture as FakeProviderFixture).generate(request("jester"), new AbortController().signal);
    expect(result).toMatchObject({ ok: false, kind });
  });

  it("supports cancellation without making a network call", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(new DeterministicFakeOracleProvider().generate(request("love"), controller.signal)).resolves.toEqual({ ok: false, kind: "cancelled" });
  });
});
