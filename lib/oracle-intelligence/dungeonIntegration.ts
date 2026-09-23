import { normalizeClientPresentation } from "./schema";
import type { DungeonPresentation, FallbackReason, TrustedOracleResponseV1 } from "./types";

export const DUNGEON_INTELLIGENCE_MIN_REVEAL_MS = 1800;
export const DUNGEON_INTELLIGENCE_CLIENT_DEADLINE_MS = 4500;
export const DUNGEON_PRESENTATION_EVENT = "qrystal:dungeon-intelligence-presentation";
export const DUNGEON_PRESENTATION_RESET_EVENT = "qrystal:dungeon-intelligence-reset";
let localIdentitySequence = 0;

export type DungeonCycleIdentity = Readonly<{
  oracleId: "dnd";
  requestId: string;
  cycleId: string;
}>;

export type DungeonDecision = Readonly<{
  identity: DungeonCycleIdentity;
  answer: string;
  source: "oracle-ai" | "protected-library" | "safety-system";
  presentation: DungeonPresentation | null;
  fallbackReason?: FallbackReason | "deadline" | "invalid_response" | "cancelled";
  clientDecisionElapsedMs: number;
  diagnostic?: unknown;
}>;

type RouteEnvelope = Readonly<{
  ok?: boolean;
  action?: string;
  requestId?: string;
  cycleId?: string;
  reason?: FallbackReason;
  response?: TrustedOracleResponseV1;
  diagnostic?: unknown;
}>;

const waitUntil = (startedAt: number, targetMs: number, now: () => number) =>
  new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, Math.max(0, targetMs - (now() - startedAt)));
  });

function acceptTrustedDungeonResponse(
  value: unknown,
  identity: DungeonCycleIdentity
): TrustedOracleResponseV1 | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as TrustedOracleResponseV1;
  if (
    candidate.schemaVersion !== "1" ||
    candidate.oracleId !== identity.oracleId ||
    candidate.requestId !== identity.requestId ||
    candidate.cycleId !== identity.cycleId ||
    (candidate.source !== "oracle-ai" && candidate.source !== "safety-system") ||
    typeof candidate.answer !== "string" ||
    !candidate.answer.trim() ||
    candidate.answer.length > 320
  ) return null;
  const presentation = normalizeClientPresentation(candidate.presentation, "dnd");
  if (!presentation) return null;
  return { ...candidate, presentation };
}

export async function runDungeonIntelligenceCycle({
  identity,
  question,
  fallbackAnswer,
  controller,
  fetcher = globalThis.fetch.bind(globalThis),
  now = () => performance.now(),
}: {
  identity: DungeonCycleIdentity;
  question: string;
  fallbackAnswer: string;
  controller: AbortController;
  fetcher?: typeof fetch;
  now?: () => number;
}): Promise<DungeonDecision> {
  const startedAt = now();
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<"deadline">((resolve) => {
    deadlineTimer = globalThis.setTimeout(() => {
      controller.abort("dungeon-intelligence-deadline");
      resolve("deadline");
    }, DUNGEON_INTELLIGENCE_CLIENT_DEADLINE_MS);
  });

  const request = fetcher("/api/oracle/intelligence/dungeon-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    signal: controller.signal,
    body: JSON.stringify({ schemaVersion: "1", ...identity, question }),
  }).then(async (response): Promise<RouteEnvelope> => {
    if (!response.ok) throw new Error("dungeon-intelligence-route-failed");
    return response.json() as Promise<RouteEnvelope>;
  });

  let envelope: RouteEnvelope | null = null;
  let deadlineWon = false;
  try {
    const outcome = await Promise.race([request, deadline]);
    if (outcome === "deadline") deadlineWon = true;
    else envelope = outcome;
  } catch {
    // Provider and transport failures are intentionally invisible to visitors.
  } finally {
    if (deadlineTimer !== undefined) globalThis.clearTimeout(deadlineTimer);
  }

  if (controller.signal.aborted && !deadlineWon) {
    return {
      identity,
      answer: fallbackAnswer,
      source: "protected-library",
      presentation: null,
      fallbackReason: "cancelled",
      clientDecisionElapsedMs: Math.max(0, now() - startedAt),
    };
  }

  const trusted = envelope?.ok && envelope.action === "use_response"
    ? acceptTrustedDungeonResponse(envelope.response, identity)
    : null;
  const elapsed = Math.max(0, now() - startedAt);
  if (!deadlineWon && elapsed < DUNGEON_INTELLIGENCE_MIN_REVEAL_MS) {
    await waitUntil(startedAt, DUNGEON_INTELLIGENCE_MIN_REVEAL_MS, now);
  }

  if (trusted) {
    return {
      identity,
      answer: trusted.answer,
      source: trusted.source,
      presentation: trusted.presentation as DungeonPresentation,
      clientDecisionElapsedMs: Math.max(0, now() - startedAt),
      diagnostic: envelope?.diagnostic,
    };
  }

  return {
    identity,
    answer: fallbackAnswer,
    source: "protected-library",
    presentation: null,
    fallbackReason: deadlineWon ? "deadline" : envelope?.reason ?? "invalid_response",
    clientDecisionElapsedMs: Math.max(0, now() - startedAt),
    diagnostic: envelope?.diagnostic,
  };
}

export function createDungeonCycleIdentity(): DungeonCycleIdentity {
  const uuid = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/gu, "");
    localIdentitySequence += 1;
    const entropy = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(entropy);
    return `${Date.now().toString(36)}${localIdentitySequence.toString(36)}${Array.from(entropy).map((value) => value.toString(36)).join("")}`;
  };
  return { oracleId: "dnd", requestId: `req_${uuid()}`, cycleId: `cycle_${uuid()}` };
}

export function emitDungeonPresentation(identity: DungeonCycleIdentity, presentation: DungeonPresentation) {
  window.dispatchEvent(new CustomEvent(DUNGEON_PRESENTATION_EVENT, {
    detail: { ...identity, presentation },
  }));
}

export function resetDungeonPresentation() {
  window.dispatchEvent(new Event(DUNGEON_PRESENTATION_RESET_EVENT));
}
