import { createHash, randomUUID } from "node:crypto";

export const INTELLIGENCE_SESSION_COOKIE = "qrystal_intelligence_session";
export const INTELLIGENCE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function createOpaqueIntelligenceSessionId() {
  return randomUUID();
}

export function cohortBucket(sessionId: string) {
  const digest = createHash("sha256").update(sessionId, "utf8").digest();
  return digest.readUInt32BE(0) % 100;
}

export function isSessionInRollout(sessionId: string, rolloutPercent: number) {
  if (rolloutPercent <= 0) return false;
  if (rolloutPercent >= 100) return true;
  return cohortBucket(sessionId) < rolloutPercent;
}
