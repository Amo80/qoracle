import { normalizeClientPresentation } from "./schema";
import type { FallbackReason, JesterPresentation, TrustedOracleResponseV1 } from "./types";

export const JESTER_INTELLIGENCE_MIN_REVEAL_MS = 1800;
export const JESTER_INTELLIGENCE_CLIENT_DEADLINE_MS = 4500;
export const JESTER_PRESENTATION_EVENT = "qrystal:jester-intelligence-presentation";
export const JESTER_PRESENTATION_RESET_EVENT = "qrystal:jester-intelligence-reset";
let localIdentitySequence = 0;

export type JesterCycleIdentity = Readonly<{
  oracleId: "jester";
  requestId: string;
  cycleId: string;
}>;

export type JesterDecision = Readonly<{
  identity: JesterCycleIdentity;
  answer: string;
  source: "oracle-ai" | "protected-library" | "safety-system";
  presentation: JesterPresentation | null;
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
    const remaining = Math.max(0, targetMs - (now() - startedAt));
    globalThis.setTimeout(resolve, remaining);
  });

function acceptTrustedJesterResponse(
  value: unknown,
  identity: JesterCycleIdentity
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
  const presentation = normalizeClientPresentation(candidate.presentation, "jester");
  if (!presentation) return null;
  return { ...candidate, presentation };
}

export async function runJesterIntelligenceCycle({
  identity,
  question,
  fallbackAnswer,
  controller,
  fetcher = globalThis.fetch.bind(globalThis),
  now = () => performance.now(),
}: {
  identity: JesterCycleIdentity;
  question: string;
  fallbackAnswer: string;
  controller: AbortController;
  fetcher?: typeof fetch;
  now?: () => number;
}): Promise<JesterDecision> {
  const startedAt = now();
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<"deadline">((resolve) => {
    deadlineTimer = globalThis.setTimeout(() => {
      controller.abort("jester-intelligence-deadline");
      resolve("deadline");
    }, JESTER_INTELLIGENCE_CLIENT_DEADLINE_MS);
  });

  const request = fetcher("/api/oracle/intelligence/live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    signal: controller.signal,
    body: JSON.stringify({
      schemaVersion: "1",
      ...identity,
      question,
    }),
  }).then(async (response): Promise<RouteEnvelope> => {
    if (!response.ok) throw new Error("jester-intelligence-route-failed");
    return response.json() as Promise<RouteEnvelope>;
  });

  let envelope: RouteEnvelope | null = null;
  let deadlineWon = false;
  try {
    const outcome = await Promise.race([request, deadline]);
    if (outcome === "deadline") deadlineWon = true;
    else envelope = outcome;
  } catch {
    // Ordinary provider/network failures are deliberately invisible to visitors.
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
    ? acceptTrustedJesterResponse(envelope.response, identity)
    : null;
  const elapsed = Math.max(0, now() - startedAt);
  if (!deadlineWon && elapsed < JESTER_INTELLIGENCE_MIN_REVEAL_MS) {
    await waitUntil(startedAt, JESTER_INTELLIGENCE_MIN_REVEAL_MS, now);
  }

  if (trusted) {
    return {
      identity,
      answer: trusted.answer,
      source: trusted.source,
      presentation: trusted.presentation as JesterPresentation,
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

export function createJesterCycleIdentity(): JesterCycleIdentity {
  const uuid = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/gu, "");
    localIdentitySequence += 1;
    const entropy = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(entropy);
    return `${Date.now().toString(36)}${localIdentitySequence.toString(36)}${Array.from(entropy).map((value) => value.toString(36)).join("")}`;
  };
  return { oracleId: "jester", requestId: `req_${uuid()}`, cycleId: `cycle_${uuid()}` };
}

export function emitJesterPresentation(
  identity: JesterCycleIdentity,
  presentation: JesterPresentation
) {
  window.dispatchEvent(new CustomEvent(JESTER_PRESENTATION_EVENT, {
    detail: { ...identity, presentation },
  }));
}

export function resetJesterPresentation() {
  window.dispatchEvent(new Event(JESTER_PRESENTATION_RESET_EVENT));
}
