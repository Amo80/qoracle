import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { isOracleIntelligenceLiveIntegrationEnabled } from "../experience/featureFlags";
import { cohortBucket, isSessionInRollout } from "./cohort";
import { ProductionIntelligenceTelemetry } from "./telemetry";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const production = {
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  ORACLE_INTELLIGENCE_ENABLED: "true",
  ORACLE_INTELLIGENCE_JESTER_ENABLED: "true",
  ORACLE_INTELLIGENCE_LOVE_ENABLED: "true",
  ORACLE_INTELLIGENCE_DUNGEON_ENABLED: "true",
  ORACLE_INTELLIGENCE_CHAOS_ENABLED: "true",
  ORACLE_INTELLIGENCE_ECLIPSE_ENABLED: "true",
  ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: "10",
  OPENAI_API_KEY: "server-only",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  ORACLE_INTELLIGENCE_RATE_LIMIT_SECRET: "r".repeat(32),
};

describe("Phase 6 Production intelligence readiness", () => {
  it("keeps Production OFF unless every server gate is valid", () => {
    expect(isOracleIntelligenceLiveIntegrationEnabled("jester", production)).toBe(true);
    expect(isOracleIntelligenceLiveIntegrationEnabled("jester", { ...production, ORACLE_INTELLIGENCE_ENABLED: "false" })).toBe(false);
    expect(isOracleIntelligenceLiveIntegrationEnabled("jester", { ...production, ORACLE_INTELLIGENCE_JESTER_ENABLED: "false" })).toBe(false);
    expect(isOracleIntelligenceLiveIntegrationEnabled("jester", { ...production, ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: "0" })).toBe(false);
    expect(isOracleIntelligenceLiveIntegrationEnabled("jester", { ...production, OPENAI_API_KEY: "" })).toBe(false);
    expect(isOracleIntelligenceLiveIntegrationEnabled("jester", { ...production, ORACLE_INTELLIGENCE_RATE_LIMIT_SECRET: "" })).toBe(false);
  });

  it("supports every Oracle flag independently", () => {
    for (const oracleId of ["jester", "love", "dnd", "chaos", "eclipse"] as const) {
      expect(isOracleIntelligenceLiveIntegrationEnabled(oracleId, production)).toBe(true);
    }
  });

  it("keeps anonymous cohorting stable at 0%, partial, and 100%", () => {
    const session = "opaque-session";
    expect(cohortBucket(session)).toBe(cohortBucket(session));
    expect(isSessionInRollout(session, 0)).toBe(false);
    expect(isSessionInRollout(session, 100)).toBe(true);
    expect(isSessionInRollout(session, cohortBucket(session))).toBe(false);
    expect(isSessionInRollout(session, cohortBucket(session) + 1)).toBe(true);
  });

  it("uses one production route with compact output, bounded timeout, no diagnostics, and no client controls", () => {
    const route = read("app/api/oracle/intelligence/live/route.ts");
    expect(route).toContain("createOpenAICompactProviderFromEnvironment");
    expect(route).toContain("liveMode: true");
    expect(route).toContain("createDefaultRateLimiter");
    expect(route).toContain("isAllowedIntelligenceOrigin");
    expect(route).toContain("ORACLE_INTELLIGENCE_MAX_BODY_BYTES");
    expect(route).not.toMatch(/diagnostic|Server-Timing|X-Oracle-Diagnostic/i);
    expect(route).not.toMatch(/searchParams|timeoutMs:|reasoning/);
    for (const oracle of ["jester", "love", "dungeon", "chaos", "eclipse"]) {
      expect(read(`lib/oracle-intelligence/${oracle}Integration.ts`)).toContain('fetcher("/api/oracle/intelligence/live"');
    }
  });

  it("keeps Preview qualification routes unavailable in Production", () => {
    const flags = read("lib/experience/featureFlags.ts");
    expect(flags).toContain('environment.VERCEL_ENV === "preview"');
    expect(flags).toContain('environment.NODE_ENV === "development"');
    for (const oracle of ["jester", "love", "dungeon", "chaos", "eclipse"]) {
      expect(read(`app/api/oracle/intelligence/${oracle}-preview/route.ts`)).toContain("PreviewIntegrationEnabled");
    }
  });

  it("keeps secrets and provider configuration out of client components", () => {
    for (const path of ["components/OracleQR.tsx", "components/living-oracle/LivingOracleLayer.tsx", "lib/oracle-intelligence/jesterIntegration.ts", "lib/oracle-intelligence/loveIntegration.ts", "lib/oracle-intelligence/dungeonIntegration.ts", "lib/oracle-intelligence/chaosIntegration.ts", "lib/oracle-intelligence/eclipseIntegration.ts"]) {
      const source = read(path);
      expect(source).not.toMatch(/OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|ORACLE_INTELLIGENCE_MODEL|RATE_LIMIT_SECRET/);
    }
  });

  it("stores only a peppered hash and performs an atomic database check", () => {
    const limiter = read("lib/oracle-intelligence/rateLimit.ts"); const migration = read("supabase/migrations/20260923180000_oracle_intelligence_rate_limits.sql");
    expect(limiter).toContain('update("\\0")'); expect(limiter).toContain("digest(\"hex\")");
    expect(migration).toContain("for update"); expect(migration).toContain("enable row level security"); expect(migration).toContain("service_role");
    expect(migration).not.toMatch(/question|answer|cookie/i);
  });

  it("logs only bounded privacy-safe Production telemetry", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    new ProductionIntelligenceTelemetry().record({ event: "success", requestId: "private-request-id", oracleId: "eclipse", schemaVersion: "1", personalityVersion: "1", vocabularyVersion: "1", latencyMs: 3100, outcome: "accepted", cues: { emotion: "private", intensity: 2, delivery: "private", gesture: "private", reveal: "private", reaction: "private", environment: "private" } });
    const serialized = JSON.stringify(spy.mock.calls);
    expect(serialized).toContain("3000_4249ms"); expect(serialized).toContain("eclipse");
    expect(serialized).not.toMatch(/private-request-id|private|answer|question|cookie|session/i);
    spy.mockRestore();
  });

  it("keeps provider storage, retries, tools, and output bounded", () => {
    const provider = read("lib/oracle-intelligence/openaiProvider.ts");
    expect(provider).toContain("store: false"); expect(provider).toContain("maxRetries: 0"); expect(provider).toContain("tools: []"); expect(provider).toContain("ORACLE_PROVIDER_MAX_OUTPUT_TOKENS = 512");
  });
});
