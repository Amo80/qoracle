# Phase 6 Intelligence Production Runbook

## Required Production configuration

- `OPENAI_API_KEY` — server-only OpenAI project key.
- `ORACLE_INTELLIGENCE_MODEL=gpt-5.6-luna` — server-only reviewed model.
- `ORACLE_INTELLIGENCE_RATE_LIMIT_SECRET` — server-only random value of at least 32 characters, generated independently of every other secret.
- Existing Supabase server variables: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- `ORACLE_INTELLIGENCE_ENABLED=false` until rollout approval.
- Five per-Oracle flags, initially `false`.
- `ORACLE_INTELLIGENCE_ROLLOUT_PERCENT=0` initially.

Apply `supabase/migrations/20260923180000_oracle_intelligence_rate_limits.sql` before enabling intelligence. Verify the table has RLS enabled, no `anon`/`authenticated` policies, and the RPC is executable only by `service_role`.

## Deployment and rollout

1. Apply and verify the Supabase limiter migration.
2. Add the server-only Production secrets and keep master/per-Oracle flags false with rollout zero.
3. Run tests, TypeScript, ESLint, performance budgets, the flags-OFF build, and the Production-readiness build.
4. Deploy with intelligence OFF.
5. Smoke-test all five protected-library experiences, direct Oracle routes, QR routes, reduced motion, Shop/Merch, checkout, and Admin/Orders.
6. Enable one Oracle at a time behind the master flag, beginning with a stable 5% cohort. Do not start at 100%.
7. Watch accepted/fallback ratio, sanitized failure categories, latency buckets, rate-limit events, safety responses, OpenAI spend, and Supabase RPC errors. Logs must never contain questions, answers, prompts, cookies, session identifiers, or secrets.
8. Kill switch: set `ORACLE_INTELLIGENCE_ENABLED=false`. A narrower rollback can disable one Oracle flag or set rollout to zero. Redeploying/reverting unrelated site functionality is not required.
9. Increase 5% → 10% → 25% → 50% only after an observation window shows stable spend, no elevated timeout/provider/validation failure rate, no limiter errors, and no visitor-experience regression.
10. Move to 100% only with explicit approval after all five Oracles pass Production smoke testing at partial rollout.

## Operational limits

- Distributed anonymous limits: 6 requests/minute and 100 requests/day per peppered session identity.
- Provider window: 4,250 ms; client decision deadline: 4,500 ms.
- Questions: at most 180 characters; request bodies: at most 2,048 bytes.
- Provider output: at most 512 total output tokens; answer validation remains 320 characters, 70 words, and 1–3 complete sentences.
- OpenAI storage is disabled, SDK retries are zero, and provider tools are empty.
- Ordinary provider, validation, rate-limit, and limiter-backend failures use the protected library.

## Cost model

At the reviewed GPT-5.6 Luna standard rates of $0.20 per million input tokens and $1.20 per million output tokens, a conservative 650-input-token plus 512-output-token request costs at most approximately $0.000744 before any cached-input discount. That is approximately $0.74 per 1,000 maximum-budget requests. Actual accepted responses observed during qualification were generally smaller. OpenAI account-level spend alerts and a monthly project budget remain required operational controls.
