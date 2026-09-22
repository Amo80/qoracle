import { describe, expect, it } from "vitest";
import { InMemoryOracleIntelligenceRateLimiter, UnavailableOracleIntelligenceRateLimiter, createDefaultRateLimiter } from "./rateLimit";

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

  it("fails safely when unavailable and requires distributed storage for Production", async () => {
    expect(await new UnavailableOracleIntelligenceRateLimiter().check({ sessionId: "a" })).toEqual({ allowed: false, reason: "unavailable" });
    expect(createDefaultRateLimiter({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBeInstanceOf(UnavailableOracleIntelligenceRateLimiter);
    expect(createDefaultRateLimiter({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBeInstanceOf(InMemoryOracleIntelligenceRateLimiter);
  });
});
