import { describe, expect, it } from "vitest";
import { ORACLE_PERSONALITIES_V1 } from "./personalities/v1";
import { ORACLE_PERFORMANCE_VOCABULARIES } from "./vocabularies";

describe("versioned Oracle personalities", () => {
  it.each(Object.keys(ORACLE_PERSONALITIES_V1) as Array<keyof typeof ORACLE_PERSONALITIES_V1>)("binds %s to its exact approved vocabulary", (oracleId) => {
    const manifest = ORACLE_PERSONALITIES_V1[oracleId];
    const vocabulary = ORACLE_PERFORMANCE_VOCABULARIES[oracleId];
    expect(manifest.oracleId).toBe(oracleId);
    expect(manifest.personalityVersion).toBe("1");
    expect(manifest.promptVersion).toBe("1");
    expect(manifest.performanceVocabularyVersion).toBe("1");
    expect(manifest.allowedGestures).toEqual(vocabulary.gestures);
    expect(manifest.allowedReactions).toEqual(vocabulary.reactions);
    expect(manifest.allowedEnvironments).toEqual(vocabulary.environments);
    expect(manifest.answerLength).toEqual({ sentences: [1, 3], targetWords: [25, 55], maximumWords: 70, maximumCharacters: 320 });
  });

  it("does not expose prohibited raw control vocabulary", () => {
    const serialized = JSON.stringify(ORACLE_PERSONALITIES_V1);
    for (const forbidden of ["quaternion", "euler", "bone_", "shader", "javascript", "asset path", "walking", "running", "jazz"]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden);
    }
  });
});
