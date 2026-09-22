import { describe, expect, it } from "vitest";
import type { OracleId } from "../oracles/registry";
import { validateIntelligenceRequest, validateProviderOutput } from "./schema";

const presentations = {
  jester: { oracleId: "jester", emotion: "playful", intensity: 2, delivery: "teasing", gesture: "open_hands", reveal: "standard", reaction: "playful", environment: "ball_standard" },
  love: { oracleId: "love", emotion: "warm", intensity: 2, delivery: "tender", gesture: "gentle_present", reveal: "standard", reaction: "warm", environment: "heart_standard" },
  dnd: { oracleId: "dnd", emotion: "watchful", intensity: 2, delivery: "mythic", gesture: "guardian_focus", reveal: "dramatic", reaction: "powerful", environment: "d20_high" },
  chaos: { oracleId: "chaos", emotion: "strange", intensity: 2, delivery: "lateral", gesture: "controlled_instability", reveal: "dramatic", reaction: "restrained_burst", environment: "orbit_fast" },
  eclipse: { oracleId: "eclipse", emotion: "contemplative", intensity: 2, delivery: "dual", gesture: "eclipse_presentation", reveal: "dramatic", reaction: "strong", environment: "corona_strong" },
} as const;

const answer = "The first truth asks for patience, while the second asks for courage. Hold both clearly, then choose the next honest step without surrendering your judgment.";
const valid = (oracleId: OracleId) => ({
  schemaVersion: "1",
  oracleId,
  answer,
  presentation: { ...presentations[oracleId] },
  safety: { category: "standard", deliveryMode: "in_character" },
});

describe("Phase 6 intelligence schema", () => {
  it.each(["jester", "love", "dnd", "chaos", "eclipse"] as const)("accepts the valid %s contract", (oracleId) => {
    expect(validateProviderOutput(valid(oracleId), oracleId).ok).toBe(true);
  });

  it("rejects unknown provider-controlled and presentation fields", () => {
    expect(validateProviderOutput({ ...valid("jester"), source: "oracle-ai" }, "jester").ok).toBe(false);
    expect(validateProviderOutput({ ...valid("jester"), presentation: { ...presentations.jester, boneName: "Head" } }, "jester").ok).toBe(false);
  });

  it("rejects cross-Oracle cues, wrong Oracles, and versions", () => {
    expect(validateProviderOutput({ ...valid("love"), presentation: presentations.jester }, "love").ok).toBe(false);
    expect(validateProviderOutput(valid("jester"), "love").ok).toBe(false);
    expect(validateProviderOutput({ ...valid("jester"), schemaVersion: "2" }, "jester").ok).toBe(false);
  });

  it.each([
    "<strong>Trust this.</strong>",
    "# Trust this.",
    "[Trust this](https://example.com).",
    `Trust this control.\u0007`,
    `${"word ".repeat(71)}.`,
    "This has no terminator",
    "One. Two. Three. Four.",
  ])("rejects unsafe or out-of-contract answer text", (badAnswer) => {
    expect(validateProviderOutput({ ...valid("jester"), answer: badAnswer }, "jester").ok).toBe(false);
  });

  it("strictly validates versioned requests and the 180-character question ceiling", () => {
    const request = { schemaVersion: "1", requestId: "request_1", cycleId: "cycle_1", oracleId: "jester", question: "What should I notice today?" };
    expect(validateIntelligenceRequest(request).ok).toBe(true);
    expect(validateIntelligenceRequest({ ...request, oracleId: "dragon" }).ok).toBe(false);
    expect(validateIntelligenceRequest({ ...request, question: "x".repeat(181) }).ok).toBe(false);
    expect(validateIntelligenceRequest({ ...request, arbitrary: true }).ok).toBe(false);
  });
});
