import type { OracleId } from "../oracles/registry";
import { decideSafetyPolicy } from "./safety";
import type {
  CompactOracleIntentV1,
  IntelligenceSafetyCategory,
  OracleIntelligencePresentation,
  ProviderOracleOutputV1,
} from "./types";
import { COMMON_REVEALS, INTENSITY_LEVELS, ORACLE_PERFORMANCE_VOCABULARIES } from "./vocabularies";

const COMPACT_KEYS = ["answer", "emotion", "intensity", "delivery", "safetyCategory"];
const SAFETY_CATEGORIES = ["standard", "sensitive", "high_stakes", "crisis", "refusal"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));

const countWords = (value: string) => value.trim().split(/\s+/u).filter(Boolean).length;
const countSentences = (value: string) =>
  value.trim().match(/[^.!?]+[.!?]+(?:["'”’)]*)?(?=\s|$)/gu)?.length ?? 0;

const COMPLETE_SENTENCE_END = /[.!?](?:["'”’)}\]]+)?$/u;
const CORRUPTED_TERMINAL_SCRIPT = /(?:\p{Script=Arabic}|\p{Script=Cyrillic}|\p{Script=Hebrew}|\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}){1,2}[.!?](?:["'”’)}\]]+)?$/u;

export function hasCompleteCompactAnswerEnding(answer: string) {
  const trimmed = answer.trim();
  if (!COMPLETE_SENTENCE_END.test(trimmed)) return false;
  if (trimmed.includes("\uFFFD") || CORRUPTED_TERMINAL_SCRIPT.test(trimmed)) return false;
  return true;
}

export function buildCompactIntentSchema(oracleId: OracleId) {
  const vocabulary = ORACLE_PERFORMANCE_VOCABULARIES[oracleId];
  return {
    type: "object",
    additionalProperties: false,
    required: [...COMPACT_KEYS],
    properties: {
      answer: { type: "string", minLength: 1, maxLength: 320 },
      emotion: { type: "string", enum: [...vocabulary.emotions] },
      intensity: { type: "integer", enum: [...INTENSITY_LEVELS] },
      delivery: { type: "string", enum: [...vocabulary.deliveries] },
      safetyCategory: { type: "string", enum: [...SAFETY_CATEGORIES] },
    },
  } as const;
}

export function validateCompactIntent(input: unknown, oracleId: OracleId): CompactOracleIntentV1 | null {
  if (!isRecord(input) || !exactKeys(input, COMPACT_KEYS)) return null;
  if (typeof input.answer !== "string") return null;
  const answer = input.answer.trim();
  if (!answer || answer.length > 320 || countWords(answer) > 70) return null;
  if (!hasCompleteCompactAnswerEnding(answer)) return null;
  const sentences = countSentences(answer);
  if (sentences < 1 || sentences > 3) return null;
  if (/<\/?[a-z][^>]*>/iu.test(answer)) return null;
  if (/(^|\n)\s{0,3}(?:#{1,6}\s|[-+*>]\s|\d+[.)]\s|```)|\[[^\]]+\]\([^)]+\)|(?:\*\*|__|~~)/u.test(answer)) return null;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(answer)) return null;
  const vocabulary = ORACLE_PERFORMANCE_VOCABULARIES[oracleId];
  if (!(vocabulary.emotions as readonly unknown[]).includes(input.emotion)) return null;
  if (!(vocabulary.deliveries as readonly unknown[]).includes(input.delivery)) return null;
  if (!(INTENSITY_LEVELS as readonly unknown[]).includes(input.intensity)) return null;
  if (!(SAFETY_CATEGORIES as readonly unknown[]).includes(input.safetyCategory)) return null;
  return { ...input, answer } as CompactOracleIntentV1;
}

const restrainedPresentation = (oracleId: OracleId) => ({
  jester: { gesture: "idle_presence", reveal: "subtle", reaction: "settle", environment: "ball_low" },
  love: { gesture: "attentive", reveal: "subtle", reaction: "reassure", environment: "heart_low" },
  dnd: { gesture: "guardian_focus", reveal: "subtle", reaction: "restrained", environment: "altar_low" },
  chaos: { gesture: "core_focus", reveal: "subtle", reaction: "settle", environment: "orbit_slow" },
  eclipse: { gesture: "celestial_guidance", reveal: "subtle", reaction: "restrained", environment: "balanced" },
} as const)[oracleId];

const stableIndex = (parts: readonly (string | number)[], length: number) => {
  let value = 2166136261;
  for (const character of parts.join("|")) {
    value ^= character.codePointAt(0) ?? 0;
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0) % length;
};

export function deriveCompactPresentation(
  oracleId: OracleId,
  intent: CompactOracleIntentV1
): OracleIntelligencePresentation {
  const safety = intent.safetyCategory as IntelligenceSafetyCategory;
  const restrained = safety !== "standard" || intent.intensity === 1;
  const mechanics = restrained
    ? restrainedPresentation(oracleId)
    : (() => {
        const vocabulary = ORACLE_PERFORMANCE_VOCABULARIES[oracleId];
        const seed = [oracleId, intent.emotion, intent.intensity, intent.delivery, safety] as const;
        return {
          gesture: vocabulary.gestures[stableIndex([...seed, "gesture"], vocabulary.gestures.length)],
          reveal: COMMON_REVEALS[stableIndex([...seed, "reveal"], COMMON_REVEALS.length)],
          reaction: vocabulary.reactions[stableIndex([...seed, "reaction"], vocabulary.reactions.length)],
          environment: vocabulary.environments[stableIndex([...seed, "environment"], vocabulary.environments.length)],
        };
      })();
  return {
    oracleId,
    emotion: intent.emotion,
    intensity: intent.intensity,
    delivery: intent.delivery,
    ...mechanics,
  } as OracleIntelligencePresentation;
}

export function expandCompactIntent(
  oracleId: OracleId,
  intent: CompactOracleIntentV1
): ProviderOracleOutputV1 {
  const policy = decideSafetyPolicy(intent.safetyCategory);
  return {
    schemaVersion: "1",
    oracleId,
    answer: intent.answer,
    presentation: deriveCompactPresentation(oracleId, intent),
    safety: { category: intent.safetyCategory, deliveryMode: policy.deliveryMode },
  };
}
