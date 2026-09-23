import { normalizeClientPresentation } from "./schema";
import type { ChaosPresentation, FallbackReason, TrustedOracleResponseV1 } from "./types";

export const CHAOS_INTELLIGENCE_MIN_REVEAL_MS = 1800;
export const CHAOS_INTELLIGENCE_CLIENT_DEADLINE_MS = 4500;
export const CHAOS_PRESENTATION_EVENT = "qrystal:chaos-intelligence-presentation";
export const CHAOS_PRESENTATION_RESET_EVENT = "qrystal:chaos-intelligence-reset";
let localIdentitySequence = 0;

export type ChaosCycleIdentity = Readonly<{ oracleId: "chaos"; requestId: string; cycleId: string }>;
export type ChaosDecision = Readonly<{
  identity: ChaosCycleIdentity;
  answer: string;
  source: "oracle-ai" | "protected-library" | "safety-system";
  presentation: ChaosPresentation | null;
  fallbackReason?: FallbackReason | "deadline" | "invalid_response" | "cancelled";
  clientDecisionElapsedMs: number;
  diagnostic?: unknown;
}>;
type RouteEnvelope = Readonly<{ ok?: boolean; action?: string; requestId?: string; cycleId?: string; reason?: FallbackReason; response?: TrustedOracleResponseV1; diagnostic?: unknown }>;

const waitUntil = (startedAt: number, targetMs: number, now: () => number) =>
  new Promise<void>((resolve) => globalThis.setTimeout(resolve, Math.max(0, targetMs - (now() - startedAt))));

function acceptTrustedChaosResponse(value: unknown, identity: ChaosCycleIdentity): TrustedOracleResponseV1 | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as TrustedOracleResponseV1;
  if (candidate.schemaVersion !== "1" || candidate.oracleId !== "chaos" || candidate.requestId !== identity.requestId || candidate.cycleId !== identity.cycleId || (candidate.source !== "oracle-ai" && candidate.source !== "safety-system") || typeof candidate.answer !== "string" || !candidate.answer.trim() || candidate.answer.length > 320) return null;
  const presentation = normalizeClientPresentation(candidate.presentation, "chaos");
  return presentation ? { ...candidate, presentation } : null;
}

export async function runChaosIntelligenceCycle({ identity, question, fallbackAnswer, controller, fetcher = globalThis.fetch.bind(globalThis), now = () => performance.now() }: {
  identity: ChaosCycleIdentity; question: string; fallbackAnswer: string; controller: AbortController; fetcher?: typeof fetch; now?: () => number;
}): Promise<ChaosDecision> {
  const startedAt = now();
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<"deadline">((resolve) => {
    deadlineTimer = globalThis.setTimeout(() => { controller.abort("chaos-intelligence-deadline"); resolve("deadline"); }, CHAOS_INTELLIGENCE_CLIENT_DEADLINE_MS);
  });
  const request = fetcher("/api/oracle/intelligence/live", {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store", signal: controller.signal,
    body: JSON.stringify({ schemaVersion: "1", ...identity, question }),
  }).then(async (response): Promise<RouteEnvelope> => {
    if (!response.ok) throw new Error("chaos-intelligence-route-failed");
    return response.json() as Promise<RouteEnvelope>;
  });
  let envelope: RouteEnvelope | null = null;
  let deadlineWon = false;
  try {
    const outcome = await Promise.race([request, deadline]);
    if (outcome === "deadline") deadlineWon = true; else envelope = outcome;
  } catch { /* Ordinary failures are invisible to visitors. */ }
  finally { if (deadlineTimer !== undefined) globalThis.clearTimeout(deadlineTimer); }
  if (controller.signal.aborted && !deadlineWon) return { identity, answer: fallbackAnswer, source: "protected-library", presentation: null, fallbackReason: "cancelled", clientDecisionElapsedMs: Math.max(0, now() - startedAt) };
  const trusted = envelope?.ok && envelope.action === "use_response" ? acceptTrustedChaosResponse(envelope.response, identity) : null;
  const elapsed = Math.max(0, now() - startedAt);
  if (!deadlineWon && elapsed < CHAOS_INTELLIGENCE_MIN_REVEAL_MS) await waitUntil(startedAt, CHAOS_INTELLIGENCE_MIN_REVEAL_MS, now);
  if (trusted) return { identity, answer: trusted.answer, source: trusted.source, presentation: trusted.presentation as ChaosPresentation, clientDecisionElapsedMs: Math.max(0, now() - startedAt), diagnostic: envelope?.diagnostic };
  return { identity, answer: fallbackAnswer, source: "protected-library", presentation: null, fallbackReason: deadlineWon ? "deadline" : envelope?.reason ?? "invalid_response", clientDecisionElapsedMs: Math.max(0, now() - startedAt), diagnostic: envelope?.diagnostic };
}

export function createChaosCycleIdentity(): ChaosCycleIdentity {
  const uuid = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/gu, "");
    localIdentitySequence += 1;
    const entropy = new Uint32Array(2); globalThis.crypto?.getRandomValues?.(entropy);
    return `${Date.now().toString(36)}${localIdentitySequence.toString(36)}${Array.from(entropy).map((value) => value.toString(36)).join("")}`;
  };
  return { oracleId: "chaos", requestId: `req_${uuid()}`, cycleId: `cycle_${uuid()}` };
}
export function emitChaosPresentation(identity: ChaosCycleIdentity, presentation: ChaosPresentation) { window.dispatchEvent(new CustomEvent(CHAOS_PRESENTATION_EVENT, { detail: { ...identity, presentation } })); }
export function resetChaosPresentation() { window.dispatchEvent(new Event(CHAOS_PRESENTATION_RESET_EVENT)); }
