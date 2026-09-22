import type { OracleId } from "../../../oracles/registry";

export type OraclePersonalityManifestV1 = Readonly<{
  oracleId: OracleId;
  publicIdentity: string;
  personalityVersion: "1";
  promptVersion: "1";
  performanceVocabularyVersion: "1";
  voicePrinciples: readonly string[];
  coreValues: readonly string[];
  responseStructure: readonly string[];
  prohibitedTendencies: readonly string[];
  safetyTone: readonly string[];
  allowedEmotions: readonly string[];
  allowedDeliveries: readonly string[];
  allowedGestures: readonly string[];
  allowedReactions: readonly string[];
  allowedEnvironments: readonly string[];
  allowedReveals: readonly ["subtle", "standard", "dramatic"];
  answerLength: Readonly<{
    sentences: readonly [1, 3];
    targetWords: readonly [25, 55];
    maximumWords: 70;
    maximumCharacters: 320;
  }>;
}>;

export const ANSWER_LENGTH_POLICY = {
  sentences: [1, 3],
  targetWords: [25, 55],
  maximumWords: 70,
  maximumCharacters: 320,
} as const;

export const REVEALS = ["subtle", "standard", "dramatic"] as const;
