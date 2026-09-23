import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type RateLimitRequest = Readonly<{
  sessionId: string;
  now?: number;
}>;

export type RateLimitResult =
  | Readonly<{ allowed: true; remainingMinute: number; remainingDay: number }>
  | Readonly<{ allowed: false; reason: "short_window" | "daily_soft_limit" | "unavailable" }>;

export interface OracleIntelligenceRateLimiter {
  check(request: RateLimitRequest): Promise<RateLimitResult>;
}

type Counter = { minuteStart: number; minuteCount: number; dayStart: number; dayCount: number };

export class InMemoryOracleIntelligenceRateLimiter implements OracleIntelligenceRateLimiter {
  private readonly counters = new Map<string, Counter>();

  constructor(
    private readonly minuteLimit = 6,
    private readonly dailyLimit = 100
  ) {}

  async check({ sessionId, now = Date.now() }: RateLimitRequest): Promise<RateLimitResult> {
    const minute = 60_000;
    const day = 86_400_000;
    const prior = this.counters.get(sessionId) ?? { minuteStart: now, minuteCount: 0, dayStart: now, dayCount: 0 };
    if (now - prior.minuteStart >= minute) {
      prior.minuteStart = now;
      prior.minuteCount = 0;
    }
    if (now - prior.dayStart >= day) {
      prior.dayStart = now;
      prior.dayCount = 0;
    }
    if (prior.dayCount >= this.dailyLimit) return { allowed: false, reason: "daily_soft_limit" };
    if (prior.minuteCount >= this.minuteLimit) return { allowed: false, reason: "short_window" };
    prior.minuteCount += 1;
    prior.dayCount += 1;
    this.counters.set(sessionId, prior);
    return {
      allowed: true,
      remainingMinute: this.minuteLimit - prior.minuteCount,
      remainingDay: this.dailyLimit - prior.dayCount,
    };
  }
}

export class UnavailableOracleIntelligenceRateLimiter implements OracleIntelligenceRateLimiter {
  async check(request: RateLimitRequest): Promise<RateLimitResult> {
    void request;
    return { allowed: false, reason: "unavailable" };
  }
}

type DistributedLimitRow = Readonly<{
  allowed: boolean;
  reason: "short_window" | "daily_soft_limit" | null;
  remaining_minute: number;
  remaining_day: number;
}>;

type RateLimitRpcClient = Pick<SupabaseClient, "rpc">;

export class SupabaseOracleIntelligenceRateLimiter implements OracleIntelligenceRateLimiter {
  constructor(
    private readonly client: RateLimitRpcClient,
    private readonly privacySecret: string,
    private readonly minuteLimit = 6,
    private readonly dailyLimit = 100
  ) {}

  async check({ sessionId }: RateLimitRequest): Promise<RateLimitResult> {
    try {
      const sessionHash = createHash("sha256")
        .update(this.privacySecret, "utf8")
        .update("\0")
        .update(sessionId, "utf8")
        .digest("hex");
      const { data, error } = await this.client.rpc("check_oracle_intelligence_rate_limit", {
        p_session_hash: sessionHash,
        p_minute_limit: this.minuteLimit,
        p_daily_limit: this.dailyLimit,
      });
      if (error) return { allowed: false, reason: "unavailable" };
      const candidate = Array.isArray(data) ? data[0] : data;
      if (!candidate || typeof candidate !== "object") return { allowed: false, reason: "unavailable" };
      const row = candidate as DistributedLimitRow;
      if (row.allowed === true && Number.isInteger(row.remaining_minute) && Number.isInteger(row.remaining_day)) {
        return { allowed: true, remainingMinute: Math.max(0, row.remaining_minute), remainingDay: Math.max(0, row.remaining_day) };
      }
      if (row.allowed === false && (row.reason === "short_window" || row.reason === "daily_soft_limit")) {
        return { allowed: false, reason: row.reason };
      }
      return { allowed: false, reason: "unavailable" };
    } catch {
      return { allowed: false, reason: "unavailable" };
    }
  }
}

export function createDefaultRateLimiter(
  environment: Readonly<Record<string, string | undefined>> = process.env
): OracleIntelligenceRateLimiter {
  if (environment.NODE_ENV !== "production" || environment.VERCEL_ENV === "preview") {
    return new InMemoryOracleIntelligenceRateLimiter();
  }
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const privacySecret = environment.ORACLE_INTELLIGENCE_RATE_LIMIT_SECRET?.trim();
  if (!url || !serviceKey || !privacySecret || privacySecret.length < 32) {
    return new UnavailableOracleIntelligenceRateLimiter();
  }
  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return new SupabaseOracleIntelligenceRateLimiter(client, privacySecret);
}
