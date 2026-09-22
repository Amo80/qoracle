import { describe, expect, it } from "vitest";
import { NEUTRAL_PRESENTATIONS } from "./director";
import { acceptTrustedPresentationOnClient, buildTrustedOracleResponse } from "./trust";

const candidate = {
  schemaVersion: "1",
  oracleId: "jester",
  answer: "A clever mask has slipped into your question, but the honest choice is still watching. Laugh once, look again, and trust the answer that remains after the performance ends.",
  presentation: { ...NEUTRAL_PRESENTATIONS.jester },
  safety: { category: "standard", deliveryMode: "in_character" },
};

describe("server and client intelligence trust boundary", () => {
  it("adds source, IDs, and fallback metadata only after server validation", () => {
    const trusted = buildTrustedOracleResponse({ candidate, expectedOracleId: "jester", requestId: "request_1", cycleId: "cycle_1" });
    expect(trusted).toMatchObject({ source: "oracle-ai", requestId: "request_1", cycleId: "cycle_1", fallback: { used: false } });
    expect(acceptTrustedPresentationOnClient(trusted, "jester")).toEqual(candidate.presentation);
  });

  it("rejects provider attempts to control trusted envelope fields or client presentation", () => {
    expect(buildTrustedOracleResponse({ candidate: { ...candidate, source: "oracle-ai" }, expectedOracleId: "jester", requestId: "request_1", cycleId: "cycle_1" })).toBeNull();
    expect(acceptTrustedPresentationOnClient({ schemaVersion: "1", oracleId: "jester", presentation: { ...candidate.presentation, assetPath: "/evil.glb" } }, "jester")).toBeNull();
  });
});
