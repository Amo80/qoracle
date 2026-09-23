import { describe, expect, it } from "vitest";
import { ORACLE_PERFORMANCE_VOCABULARIES } from "./vocabularies";
import {
  buildCompactIntentSchema,
  deriveCompactPresentation,
  expandCompactIntent,
  hasCompleteCompactAnswerEnding,
  validateCompactIntent,
} from "./compactIntent";
import { buildOracleStructuredOutputSchema } from "./structuredOutput";

const jesterIntent = {
  answer: "The door may change your road, but your brave little foot still has to cross the threshold. Take one honest step and see which bells begin ringing.",
  emotion: "mischievous",
  intensity: 3,
  delivery: "theatrical",
  safetyCategory: "standard",
} as const;

describe("compact semantic-intent experiment", () => {
  it("exposes only answer and bounded semantic intent to the provider", () => {
    const schema = buildCompactIntentSchema("jester");
    expect({
      fullSchemaCharacters: JSON.stringify(buildOracleStructuredOutputSchema("jester")).length,
      compactSchemaCharacters: JSON.stringify(schema).length,
    }).toEqual({ fullSchemaCharacters: 1280, compactSchemaCharacters: 481 });
    expect(schema.required).toEqual(["answer", "emotion", "intensity", "delivery", "safetyCategory"]);
    expect(Object.keys(schema.properties)).toEqual(schema.required);
    expect(JSON.stringify(schema)).not.toMatch(/gesture|reveal|reaction|environment|oracleId|schemaVersion|deliveryMode/);
    expect(validateCompactIntent({ ...jesterIntent, gesture: "open_hands" }, "jester")).toBeNull();
  });

  it("derives a deterministic full Jester presentation from approved vocabulary", () => {
    const first = deriveCompactPresentation("jester", jesterIntent);
    const second = deriveCompactPresentation("jester", jesterIntent);
    expect(first).toEqual(second);
    expect(ORACLE_PERFORMANCE_VOCABULARIES.jester.gestures).toContain(first.gesture);
    expect(ORACLE_PERFORMANCE_VOCABULARIES.jester.reactions).toContain(first.reaction);
    expect(ORACLE_PERFORMANCE_VOCABULARIES.jester.environments).toContain(first.environment);
    expect(JSON.stringify(first)).not.toMatch(/heart_standard|d20_|orbit_|corona_|celestial_/);
  });

  it("biases sensitive and high-stakes intent toward restrained presentation", () => {
    for (const safetyCategory of ["sensitive", "high_stakes", "crisis", "refusal"] as const) {
      expect(deriveCompactPresentation("jester", { ...jesterIntent, safetyCategory })).toMatchObject({
        gesture: "idle_presence",
        reveal: "subtle",
        reaction: "settle",
        environment: "ball_low",
      });
    }
  });

  it("produces meaningful deterministic variation without arbitrary randomness", () => {
    const directions = [
      jesterIntent,
      { ...jesterIntent, emotion: "playful" as const, intensity: 2 as const },
      { ...jesterIntent, emotion: "insightful" as const, delivery: "sincere" as const },
    ].map((intent) => deriveCompactPresentation("jester", intent));
    expect(new Set(directions.map(({ gesture, reveal, reaction, environment }) =>
      JSON.stringify({ gesture, reveal, reaction, environment })
    )).size).toBeGreaterThan(1);
  });

  it("derives Love-only cues and restrains sensitive relationship delivery", () => {
    const loveIntent = {
      answer: "Your heart can stay open without abandoning its boundaries. Notice whether this relationship makes honest care easier for both of you.",
      emotion: "compassionate",
      intensity: 2,
      delivery: "tender",
      safetyCategory: "sensitive",
    } as const;
    const direction = deriveCompactPresentation("love", loveIntent);
    expect(direction).toMatchObject({
      oracleId: "love",
      gesture: "attentive",
      reveal: "subtle",
      reaction: "reassure",
      environment: "heart_low",
    });
    expect(JSON.stringify(direction)).not.toMatch(/open_hands|ball_|d20_|fragments_|celestial_/);
    expect(deriveCompactPresentation("love", loveIntent)).toEqual(direction);
  });

  it("derives Dungeon-only cues and restrains sensitive guardian delivery", () => {
    const intent = {
      answer: "A failed trial still leaves a map. Carry its lesson, prepare with care, and approach the next gate without mistaking fear for prophecy.",
      emotion: "watchful",
      intensity: 2,
      delivery: "measured",
      safetyCategory: "sensitive",
    } as const;
    const direction = deriveCompactPresentation("dnd", intent);
    expect(direction).toMatchObject({
      oracleId: "dnd",
      gesture: "guardian_focus",
      reveal: "subtle",
      reaction: "restrained",
      environment: "altar_low",
    });
    expect(JSON.stringify(direction)).not.toMatch(/open_hands|heart_|fragments_|celestial_/);
    expect(deriveCompactPresentation("dnd", intent)).toEqual(direction);
  });

  it("derives Chaos-only cues and restrains sensitive unstable energy", () => {
    const intent = { answer: "When the old map dissolves, choose one solid next step. Uncertainty can open a door without requiring you to sprint through every wall.", emotion: "clear", intensity: 2, delivery: "direct", safetyCategory: "sensitive" } as const;
    const direction = deriveCompactPresentation("chaos", intent);
    expect(direction).toMatchObject({ oracleId: "chaos", gesture: "core_focus", reveal: "subtle", reaction: "settle", environment: "orbit_slow" });
    expect(JSON.stringify(direction)).not.toMatch(/open_hands|heart_|d20_|celestial_/);
    expect(deriveCompactPresentation("chaos", intent)).toEqual(direction);
  });

  it("expands into the existing full trusted boundary with server-owned metadata", () => {
    const expanded = expandCompactIntent("jester", jesterIntent);
    expect(expanded).toMatchObject({
      schemaVersion: "1",
      oracleId: "jester",
      answer: jesterIntent.answer,
      presentation: { oracleId: "jester" },
      safety: { category: "standard", deliveryMode: "in_character" },
    });
  });

  it("rejects an otherwise valid answer with an incomplete trailing thought", () => {
    const answer = "Growth can stretch you without asking you to disappear. It may be time to listen carefully, but it shouldn’t";
    expect(hasCompleteCompactAnswerEnding(answer)).toBe(false);
    expect(validateCompactIntent({ ...jesterIntent, answer }, "jester")).toBeNull();
  });

  it("rejects clear terminal corruption even when punctuation makes the JSON look complete", () => {
    const answer = "Familiarity can dress itself as fate, so tug the costume gently before you follow it. Notice what fear has mistaken familiarity for أ?";
    expect(hasCompleteCompactAnswerEnding(answer)).toBe(false);
    expect(validateCompactIntent({ ...jesterIntent, answer }, "jester")).toBeNull();
    expect(validateCompactIntent({ ...jesterIntent, answer: "A complete thought with replacement corruption \uFFFD." }, "jester")).toBeNull();
  });

  it("accepts naturally completed sentences and closing quotation marks at the hard boundary", () => {
    expect(hasCompleteCompactAnswerEnding("The bells agree: take the honest step!" )).toBe(true);
    expect(hasCompleteCompactAnswerEnding("The Jester whispers, “Choose the door that still makes you grin.”")).toBe(true);
    const prefix = "Choose carefully, then trust the truth that remains when every borrowed fear has finished performing for you";
    const exactBoundary = `${prefix}${" very".repeat(42)}!”`;
    expect(exactBoundary).toHaveLength(320);
    expect(validateCompactIntent({ ...jesterIntent, answer: exactBoundary }, "jester")).not.toBeNull();
  });
});
