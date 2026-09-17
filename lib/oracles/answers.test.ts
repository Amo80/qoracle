import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ORACLE_ANSWERS } from "./answers";

const protectedLibraries = {
  jester: {
    count: 26,
    sha256: "c80e769d0904b091ee341039c3279749c8ea508b11ba5e7721dca014a765b6a7",
  },
  chaos: {
    count: 36,
    sha256: "ee639c217be92910348ac7fc3bf2beaceeb6214b53843108cafbd7c5278d88c2",
  },
  love: {
    count: 52,
    sha256: "1d9a9c7931c859ef8212b621989bf8bdca4eeddae9975f2f20a2cc726e74d0f3",
  },
  eclipse: {
    count: 26,
    sha256: "e2ee66471b0ca09e769afaec55de6adce6984b3a8f7b82703102fe018845edb4",
  },
  dnd: {
    count: 15,
    sha256: "bee944b28bd3c8f894190859891294d87183549e71d3771dac7504426bc5fd9c",
  },
} as const;

describe("protected Oracle answer libraries", () => {
  for (const [theme, protection] of Object.entries(protectedLibraries)) {
    it(`preserves the exact ${theme} answer content and order`, () => {
      const answers = ORACLE_ANSWERS[theme as keyof typeof ORACLE_ANSWERS];
      const digest = createHash("sha256")
        .update(JSON.stringify(answers))
        .digest("hex");

      expect(answers).toHaveLength(protection.count);
      expect(digest).toBe(protection.sha256);
    });
  }

  it("preserves the complete protected answer total", () => {
    expect(
      Object.values(ORACLE_ANSWERS).reduce(
        (total, answers) => total + answers.length,
        0
      )
    ).toBe(155);
  });
});
