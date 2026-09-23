import { NextRequest, NextResponse } from "next/server";
import { createOpaqueIntelligenceSessionId, INTELLIGENCE_SESSION_COOKIE, INTELLIGENCE_SESSION_MAX_AGE_SECONDS } from "../../../../../lib/oracle-intelligence/cohort";
import { isOracleIntelligenceLiveIntegrationEnabled } from "../../../../../lib/experience/featureFlags";
import { isAllowedIntelligenceOrigin, isJsonContentType, ORACLE_INTELLIGENCE_MAX_BODY_BYTES } from "../../../../../lib/oracle-intelligence/http";
import { createOpenAICompactProviderFromEnvironment } from "../../../../../lib/oracle-intelligence/openaiProvider";
import { createDefaultRateLimiter } from "../../../../../lib/oracle-intelligence/rateLimit";
import { runOracleIntelligenceService } from "../../../../../lib/oracle-intelligence/service";
import { createProductionIntelligenceTelemetry } from "../../../../../lib/oracle-intelligence/telemetry";
import { normalizeOracleId } from "../../../../../lib/oracles/registry";

export const runtime = "nodejs";
const rateLimiter = createDefaultRateLimiter();
const telemetry = createProductionIntelligenceTelemetry();
const notFound = () => NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
const invalidRequest = () => NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });

export async function POST(request: NextRequest) {
  if (!isAllowedIntelligenceOrigin(request) || !isJsonContentType(request)) return invalidRequest();
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > ORACLE_INTELLIGENCE_MAX_BODY_BYTES) return invalidRequest();
  let text: string;
  try { text = await request.text(); } catch { return invalidRequest(); }
  if (new TextEncoder().encode(text).byteLength > ORACLE_INTELLIGENCE_MAX_BODY_BYTES) return invalidRequest();
  let body: unknown;
  try { body = JSON.parse(text); } catch { return invalidRequest(); }
  const rawOracleId = body && typeof body === "object" ? (body as { oracleId?: unknown }).oracleId : null;
  const oracleId = typeof rawOracleId === "string" ? normalizeOracleId(rawOracleId) : null;
  if (!oracleId || rawOracleId !== oracleId) return invalidRequest();
  if (!isOracleIntelligenceLiveIntegrationEnabled(oracleId)) return notFound();

  const existingSession = request.cookies.get(INTELLIGENCE_SESSION_COOKIE)?.value;
  const sessionId = existingSession || createOpaqueIntelligenceSessionId();
  const result = await runOracleIntelligenceService({
    candidateRequest: body,
    sessionId,
    provider: createOpenAICompactProviderFromEnvironment(),
    rateLimiter,
    telemetry,
    signal: request.signal,
    liveMode: true,
  });
  if (!result) return invalidRequest();
  const response = NextResponse.json(result, { status: 200, headers: { "Cache-Control": "no-store" } });
  if (!existingSession) response.cookies.set(INTELLIGENCE_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: INTELLIGENCE_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
