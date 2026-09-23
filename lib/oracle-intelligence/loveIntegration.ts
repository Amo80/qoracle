import { normalizeClientPresentation } from "./schema";
import type { FallbackReason, LovePresentation, TrustedOracleResponseV1 } from "./types";

export const LOVE_INTELLIGENCE_MIN_REVEAL_MS = 1800;
export const LOVE_INTELLIGENCE_CLIENT_DEADLINE_MS = 4500;
export const LOVE_PRESENTATION_EVENT = "qrystal:love-intelligence-presentation";
export const LOVE_PRESENTATION_RESET_EVENT = "qrystal:love-intelligence-reset";
let localIdentitySequence = 0;

export type LoveCycleIdentity = Readonly<{
  oracleId: "love";
  requestId: string;
  cycleId: string;
}>;

export type LoveDecision = Readonly<{
  identity: LoveCycleIdentity;
  answer: string;
  source: "oracle-ai" | "protected-library" | "safety-system";
  presentation: LovePresentation | null;
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

function acceptTrustedLoveResponse(
  value: unknown,
  identity: LoveCycleIdentity
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
  const presentation = normalizeClientPresentation(candidate.presentation, "love");
  if (!presentation) return null;
  return { ...candidate, presentation };
}

export async function runLoveIntelligenceCycle({
  identity,
  question,
  fallbackAnswer,
  controller,
  fetcher = globalThis.fetch.bind(globalThis),
  now = () => performance.now(),
}: {
  identity: LoveCycleIdentity;
  question: string;
  fallbackAnswer: string;
  controller: AbortController;
  fetcher?: typeof fetch;
  now?: () => number;
}): Promise<LoveDecision> {
  const startedAt = now();
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<"deadline">((resolve) => {
    deadlineTimer = globalThis.setTimeout(() => {
      controller.abort("love-intelligence-deadline");
      resolve("deadline");
    }, LOVE_INTELLIGENCE_CLIENT_DEADLINE_MS);
  });

  const request = fetcher("/api/oracle/intelligence/love-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    signal: controller.signal,
    body: JSON.stringify({ schemaVersion: "1", ...identity, question }),
  }).then(async (response): Promise<RouteEnvelope> => {
    if (!response.ok) throw new Error("love-intelligence-route-failed");
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
    ? acceptTrustedLoveResponse(envelope.response, identity)
    : null;
  const elapsed = Math.max(0, now() - startedAt);
  if (!deadlineWon && elapsed < LOVE_INTELLIGENCE_MIN_REVEAL_MS) {
    await waitUntil(startedAt, LOVE_INTELLIGENCE_MIN_REVEAL_MS, now);
  }

  if (trusted) {
    return {
      identity,
      answer: trusted.answer,
      source: trusted.source,
      presentation: trusted.presentation as LovePresentation,
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

export function createLoveCycleIdentity(): LoveCycleIdentity {
  const uuid = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/gu, "");
    localIdentitySequence += 1;
    const entropy = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(entropy);
    return `${Date.now().toString(36)}${localIdentitySequence.toString(36)}${Array.from(entropy).map((value) => value.toString(36)).join("")}`;
  };
  return { oracleId: "love", requestId: `req_${uuid()}`, cycleId: `cycle_${uuid()}` };
}

export function emitLovePresentation(identity: LoveCycleIdentity, presentation: LovePresentation) {
  window.dispatchEvent(new CustomEvent(LOVE_PRESENTATION_EVENT, {
    detail: { ...identity, presentation },
  }));
}

export function resetLovePresentation() {
  window.dispatchEvent(new Event(LOVE_PRESENTATION_RESET_EVENT));
}
