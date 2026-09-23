import { describe, expect, it } from "vitest";
import { InMemoryOracleIntelligenceRateLimiter, SupabaseOracleIntelligenceRateLimiter, UnavailableOracleIntelligenceRateLimiter, createDefaultRateLimiter } from "./rateLimit";

describe("Oracle Intelligence rate limiting", () => {
  it("enforces per-session short and daily limits without question data", async () => {
    const limiter = new InMemoryOracleIntelligenceRateLimiter(2, 3);
    expect((await limiter.check({ sessionId: "a", now: 0 })).allowed).toBe(true);
    expect((await limiter.check({ sessionId: "a", now: 1 })).allowed).toBe(true);
    expect(await limiter.check({ sessionId: "a", now: 2 })).toEqual({ allowed: false, reason: "short_window" });
    expect((await limiter.check({ sessionId: "a", now: 60_001 })).allowed).toBe(true);
    expect(await limiter.check({ sessionId: "a", now: 120_002 })).toEqual({ allowed: false, reason: "daily_soft_limit" });
    expect((await limiter.check({ sessionId: "b", now: 2 })).allowed).toBe(true);
  });

  it("fails safely when Production distributed configuration is absent", async () => {
    expect(await new UnavailableOracleIntelligenceRateLimiter().check({ sessionId: "a" })).toEqual({ allowed: false, reason: "unavailable" });
    expect(createDefaultRateLimiter({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBeInstanceOf(UnavailableOracleIntelligenceRateLimiter);
    expect(createDefaultRateLimiter({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBeInstanceOf(InMemoryOracleIntelligenceRateLimiter);
  });

  it("hashes anonymous identity before an atomic distributed check", async () => {
    const calls: unknown[][] = [];
    const client = { rpc: async (...args: unknown[]) => { calls.push(args); return { data: [{ allowed: true, reason: null, remaining_minute: 5, remaining_day: 99 }], error: null }; } };
    const limiter = new SupabaseOracleIntelligenceRateLimiter(client as never, "a".repeat(32));
    await expect(limiter.check({ sessionId: "raw-session-marker" })).resolves.toEqual({ allowed: true, remainingMinute: 5, remainingDay: 99 });
    expect(JSON.stringify(calls)).not.toContain("raw-session-marker");
    expect(calls[0]?.[0]).toBe("check_oracle_intelligence_rate_limit");
    expect(calls[0]?.[1]).toMatchObject({ p_minute_limit: 6, p_daily_limit: 100, p_session_hash: expect.stringMatching(/^[0-9a-f]{64}$/) });
  });

  it("fails closed when the distributed backend errors or returns invalid data", async () => {
    const errored = new SupabaseOracleIntelligenceRateLimiter({ rpc: async () => ({ data: null, error: { message: "down" } }) } as never, "b".repeat(32));
    const malformed = new SupabaseOracleIntelligenceRateLimiter({ rpc: async () => ({ data: [{ allowed: true }], error: null }) } as never, "b".repeat(32));
    await expect(errored.check({ sessionId: "a" })).resolves.toEqual({ allowed: false, reason: "unavailable" });
    await expect(malformed.check({ sessionId: "a" })).resolves.toEqual({ allowed: false, reason: "unavailable" });
  });

  it("constructs distributed Production limiting only with complete server configuration", () => {
    const environment = { NODE_ENV: "production", VERCEL_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role", ORACLE_INTELLIGENCE_RATE_LIMIT_SECRET: "s".repeat(32) };
    expect(createDefaultRateLimiter(environment)).toBeInstanceOf(SupabaseOracleIntelligenceRateLimiter);
    expect(createDefaultRateLimiter({ ...environment, ORACLE_INTELLIGENCE_RATE_LIMIT_SECRET: "short" })).toBeInstanceOf(UnavailableOracleIntelligenceRateLimiter);
  });
});
