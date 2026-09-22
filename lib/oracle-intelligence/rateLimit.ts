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

export function createDefaultRateLimiter(
  environment: Readonly<Record<string, string | undefined>> = process.env
): OracleIntelligenceRateLimiter {
  // Preview and local qualification may use process-local counters. Production
  // rollout must supply a distributed implementation before enabling AI.
  return environment.NODE_ENV !== "production" || environment.VERCEL_ENV === "preview"
    ? new InMemoryOracleIntelligenceRateLimiter()
    : new UnavailableOracleIntelligenceRateLimiter();
}
