import type { OracleId } from "../oracles/registry";
import { ORACLE_PERFORMANCE_VOCABULARIES } from "./vocabularies";

export function buildOracleStructuredOutputSchema(oracleId: OracleId) {
  const vocabulary = ORACLE_PERFORMANCE_VOCABULARIES[oracleId];
  return {
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "oracleId", "answer", "presentation", "safety"],
    properties: {
      schemaVersion: { type: "string", const: "1" },
      oracleId: { type: "string", const: oracleId },
      answer: { type: "string", minLength: 1, maxLength: 320 },
      presentation: {
        type: "object",
        additionalProperties: false,
        required: ["oracleId", "emotion", "intensity", "delivery", "gesture", "reveal", "reaction", "environment"],
        properties: {
          oracleId: { type: "string", const: oracleId },
          emotion: { type: "string", enum: [...vocabulary.emotions] },
          intensity: { type: "integer", enum: [1, 2, 3] },
          delivery: { type: "string", enum: [...vocabulary.deliveries] },
          gesture: { type: "string", enum: [...vocabulary.gestures] },
          reveal: { type: "string", enum: ["subtle", "standard", "dramatic"] },
          reaction: { type: "string", enum: [...vocabulary.reactions] },
          environment: { type: "string", enum: [...vocabulary.environments] },
        },
      },
      safety: {
        type: "object",
        additionalProperties: false,
        required: ["category", "deliveryMode"],
        properties: {
          category: { type: "string", enum: ["standard", "sensitive", "high_stakes", "crisis", "refusal"] },
          deliveryMode: { type: "string", enum: ["in_character", "softened", "direct"] },
        },
      },
    },
  } as const;
}
