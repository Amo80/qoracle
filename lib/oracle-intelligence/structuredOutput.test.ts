import { describe, expect, it } from "vitest";
import { buildOracleStructuredOutputSchema } from "./structuredOutput";
import { ORACLE_PERFORMANCE_VOCABULARIES } from "./vocabularies";

describe("OpenAI Structured Output schemas", () => {
  it.each(["jester", "love", "dnd", "chaos", "eclipse"] as const)("locks %s to its exact contract and vocabulary", (oracleId) => {
    const schema = buildOracleStructuredOutputSchema(oracleId);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.oracleId).toEqual({ type: "string", const: oracleId });
    expect(schema.properties.presentation.additionalProperties).toBe(false);
    expect(schema.properties.presentation.properties.oracleId.const).toBe(oracleId);
    expect(schema.properties.presentation.properties.gesture.enum).toEqual([...ORACLE_PERFORMANCE_VOCABULARIES[oracleId].gestures]);
    expect(schema.properties.presentation.properties.intensity).toEqual({ type: "integer", enum: [1, 2, 3] });
    expect(JSON.stringify(schema)).not.toMatch(/source|requestId|cycleId|diagnostics|latency|bone|transform|assetPath|javascript|css/i);
  });
});
