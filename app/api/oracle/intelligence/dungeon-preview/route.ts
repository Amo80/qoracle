import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createOpaqueIntelligenceSessionId,
  INTELLIGENCE_SESSION_COOKIE,
  INTELLIGENCE_SESSION_MAX_AGE_SECONDS,
} from "../../../../../lib/oracle-intelligence/cohort";
import { PreviewIntelligenceDiagnosticRecorder } from "../../../../../lib/oracle-intelligence/diagnostics";
import { isDungeonIntelligencePreviewIntegrationEnabled } from "../../../../../lib/experience/featureFlags";
import {
  isAllowedIntelligenceOrigin,
  isJsonContentType,
  ORACLE_INTELLIGENCE_MAX_BODY_BYTES,
} from "../../../../../lib/oracle-intelligence/http";
import { createOpenAICompactProviderFromEnvironment } from "../../../../../lib/oracle-intelligence/openaiProvider";
import { createDefaultRateLimiter } from "../../../../../lib/oracle-intelligence/rateLimit";
import { runOracleIntelligenceService } from "../../../../../lib/oracle-intelligence/service";
import { DUNGEON_PREVIEW_PROVIDER_TIMEOUT_MS } from "../../../../../lib/oracle-intelligence/timeout";

export const runtime = "nodejs";

const instanceId = randomUUID();
let invocationCount = 0;
const rateLimiter = createDefaultRateLimiter();

const notFound = () => NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
const invalidRequest = () => NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });

export async function POST(request: NextRequest) {
  if (!isDungeonIntelligencePreviewIntegrationEnabled()) return notFound();
  if (!isAllowedIntelligenceOrigin(request) || !isJsonContentType(request)) return invalidRequest();

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > ORACLE_INTELLIGENCE_MAX_BODY_BYTES) return invalidRequest();

  let text: string;
  try {
    text = await request.text();
  } catch {
    return invalidRequest();
  }
  if (new TextEncoder().encode(text).byteLength > ORACLE_INTELLIGENCE_MAX_BODY_BYTES) return invalidRequest();

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return invalidRequest();
  }
  if (!body || typeof body !== "object" || (body as { oracleId?: unknown }).oracleId !== "dnd") {
    return invalidRequest();
  }

  invocationCount += 1;
  const diagnostics = new PreviewIntelligenceDiagnosticRecorder(
    instanceId,
    invocationCount,
    "dungeon-integration",
    DUNGEON_PREVIEW_PROVIDER_TIMEOUT_MS
  );
  const existingSession = request.cookies.get(INTELLIGENCE_SESSION_COOKIE)?.value;
  const sessionId = existingSession || createOpaqueIntelligenceSessionId();
  const result = await runOracleIntelligenceService({
    candidateRequest: body,
    sessionId,
    provider: createOpenAICompactProviderFromEnvironment(),
    rateLimiter,
    signal: request.signal,
    dungeonPreviewMode: true,
    diagnostics,
  });
  if (!result) return invalidRequest();

  diagnostics.finish();
  const response = NextResponse.json(
    { ...result, diagnostic: diagnostics.snapshot() },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Server-Timing": diagnostics.serverTimingHeader(),
        "X-Oracle-Diagnostic": "preview-dungeon-integration-v1",
      },
    }
  );
  if (!existingSession) {
    response.cookies.set(INTELLIGENCE_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: INTELLIGENCE_SESSION_MAX_AGE_SECONDS,
    });
  }
  return response;
}
