import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { characterReducer, type CharacterPhase } from "./machine";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Phase 5 high-severity lifecycle corrections", () => {
  const layer = read("components/living-oracle/LivingOracleLayer.tsx");

  it.each(["speaking", "reacting", "returning"] as CharacterPhase[])(
    "resets a newly active Oracle to idle when the previous Oracle was %s",
    (phase) => {
      const previous = { phase, cycle: 7, resumePhase: null } as const;
      expect(characterReducer(previous, { type: "RESET" })).toEqual({
        phase: "idle",
        cycle: 0,
        resumePhase: null,
      });
    }
  );

  it("invalidates prior-Oracle callbacks and removes fired or cancelled schedule records", () => {
    expect(layer).toContain("generationRef.current += 1");
    expect(layer).toContain("const generation = generationRef.current");
    expect(layer).toContain("if (generation !== generationRef.current) return");
    expect(layer).toContain("timersRef.current.delete(key)");
    expect(layer).toContain("timersRef.current.clear()");
    expect(layer).toContain("scheduledRef.current.clear()");
    expect(layer).toContain("beginOracleSession(detected)");
  });

  it("cancels the prior presentation before every rapid replacement cycle", () => {
    expect(layer).toMatch(/const beginQuestionCycle[\s\S]*generationRef\.current \+= 1;[\s\S]*cancelSchedules\(\);[\s\S]*transition\(\{ type: "SUBMIT" \}\)/);
    expect(layer).toContain("busy && canBeginQuestionCycle(current.phase)");
  });
});
