import { normalizeOracleId, type OracleId } from "../oracles/registry";
import type {
  OracleIntelligencePresentation,
  RequestValidation,
  ProviderOracleOutputV1,
  ProviderOutputValidation,
} from "./types";
import {
  COMMON_REVEALS,
  INTELLIGENCE_SCHEMA_VERSION,
  INTENSITY_LEVELS,
  ORACLE_PERFORMANCE_VOCABULARIES,
} from "./vocabularies";

const OUTPUT_KEYS = ["schemaVersion", "oracleId", "answer", "presentation", "safety"];
const PRESENTATION_KEYS = ["oracleId", "emotion", "intensity", "delivery", "gesture", "reveal", "reaction", "environment"];
const SAFETY_KEYS = ["category", "deliveryMode"];
const SAFETY_CATEGORIES = ["standard", "sensitive", "high_stakes", "crisis", "refusal"] as const;
const DELIVERY_MODES = ["in_character", "softened", "direct"] as const;
const REQUEST_KEYS = ["schemaVersion", "requestId", "cycleId", "oracleId", "question"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function exactKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  return Object.keys(value).length === allowed.length && Object.keys(value).every((key) => allowed.includes(key));
}

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const matches = value.trim().match(/[^.!?]+[.!?]+(?:["'”’)]*)?(?=\s|$)/gu);
  return matches?.length ?? 0;
}

function validateAnswer(answer: unknown, issues: string[]) {
  if (typeof answer !== "string") {
    issues.push("answer must be a string");
    return;
  }
  const trimmed = answer.trim();
  if (!trimmed || trimmed.length > 320) issues.push("answer must contain 1-320 characters");
  if (wordCount(trimmed) > 70) issues.push("answer must contain no more than 70 words");
  const sentences = sentenceCount(trimmed);
  if (sentences < 1 || sentences > 3) issues.push("answer must contain 1-3 complete sentences");
  if (/<\/?[a-z][^>]*>/iu.test(trimmed)) issues.push("answer must not contain HTML");
  if (/(^|\n)\s{0,3}(?:#{1,6}\s|[-+*>]\s|\d+[.)]\s|```)|\[[^\]]+\]\([^)]+\)|(?:\*\*|__|~~)/u.test(trimmed)) {
    issues.push("answer must not contain Markdown structures");
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(trimmed)) {
    issues.push("answer must not contain control characters");
  }
}

function validatePresentation(value: unknown, oracleId: OracleId, issues: string[]) {
  if (!isRecord(value) || !exactKeys(value, PRESENTATION_KEYS)) {
    issues.push("presentation must contain only the required fields");
    return;
  }
  if (value.oracleId !== oracleId) issues.push("presentation Oracle must match response Oracle");
  const vocabulary = ORACLE_PERFORMANCE_VOCABULARIES[oracleId];
  const includes = (list: readonly unknown[], candidate: unknown) => list.includes(candidate);
  if (!includes(vocabulary.emotions, value.emotion)) issues.push("emotion is not allowed for this Oracle");
  if (!includes(vocabulary.deliveries, value.delivery)) issues.push("delivery is not allowed for this Oracle");
  if (!includes(vocabulary.gestures, value.gesture)) issues.push("gesture is not allowed for this Oracle");
  if (!includes(vocabulary.reactions, value.reaction)) issues.push("reaction is not allowed for this Oracle");
  if (!includes(vocabulary.environments, value.environment)) issues.push("environment is not allowed for this Oracle");
  if (!includes(COMMON_REVEALS, value.reveal)) issues.push("reveal is not allowed");
  if (!includes(INTENSITY_LEVELS, value.intensity)) issues.push("intensity is not allowed");
}

export function validateProviderOutput(
  input: unknown,
  expectedOracleId?: OracleId
): ProviderOutputValidation {
  const issues: string[] = [];
  if (!isRecord(input) || !exactKeys(input, OUTPUT_KEYS)) {
    return { ok: false, kind: "validation_failure", issues: ["response must contain only the required fields"] };
  }
  if (input.schemaVersion !== INTELLIGENCE_SCHEMA_VERSION) issues.push("unsupported schema version");
  const oracleId = typeof input.oracleId === "string" ? normalizeOracleId(input.oracleId) : null;
  if (!oracleId || input.oracleId !== oracleId) issues.push("invalid Oracle ID");
  if (oracleId && expectedOracleId && oracleId !== expectedOracleId) issues.push("response Oracle does not match request Oracle");
  validateAnswer(input.answer, issues);
  if (oracleId) validatePresentation(input.presentation, oracleId, issues);
  if (!isRecord(input.safety) || !exactKeys(input.safety, SAFETY_KEYS)) {
    issues.push("safety must contain only the required fields");
  } else {
    if (!SAFETY_CATEGORIES.includes(input.safety.category as never)) issues.push("invalid safety category");
    if (!DELIVERY_MODES.includes(input.safety.deliveryMode as never)) issues.push("invalid safety delivery mode");
  }
  if (issues.length) return { ok: false, kind: "validation_failure", issues };
  return { ok: true, value: input as unknown as ProviderOracleOutputV1 };
}

export function validateIntelligenceRequest(input: unknown): RequestValidation {
  const issues: string[] = [];
  if (!isRecord(input) || !exactKeys(input, REQUEST_KEYS)) {
    return { ok: false, kind: "validation_failure", issues: ["request must contain only the required fields"] };
  }
  if (input.schemaVersion !== INTELLIGENCE_SCHEMA_VERSION) issues.push("unsupported schema version");
  const oracleId = typeof input.oracleId === "string" ? normalizeOracleId(input.oracleId) : null;
  if (!oracleId || input.oracleId !== oracleId) issues.push("invalid Oracle ID");
  for (const key of ["requestId", "cycleId"] as const) {
    if (typeof input[key] !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(input[key])) issues.push(`invalid ${key}`);
  }
  if (typeof input.question !== "string" || input.question.trim().length < 1 || input.question.length > 180) {
    issues.push("question must contain 1-180 characters");
  } else if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(input.question)) {
    issues.push("question must not contain control characters");
  }
  if (issues.length) return { ok: false, kind: "validation_failure", issues };
  return { ok: true, value: input as unknown as import("./types").OracleIntelligenceRequestV1 };
}

export function normalizeClientPresentation(
  value: unknown,
  oracleId: OracleId
): OracleIntelligencePresentation | null {
  const probe = validateProviderOutput({
    schemaVersion: "1",
    oracleId,
    answer: "The path is visible now, but your next deliberate step will reveal what it truly asks of you.",
    presentation: value,
    safety: { category: "standard", deliveryMode: "in_character" },
  }, oracleId);
  return probe.ok ? probe.value.presentation : null;
}
