create table if not exists public.oracle_intelligence_rate_limits (
  session_hash text primary key check (session_hash ~ '^[0-9a-f]{64}$'),
  minute_started_at timestamptz not null default now(),
  minute_count integer not null default 0 check (minute_count >= 0),
  day_started_at timestamptz not null default now(),
  day_count integer not null default 0 check (day_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.oracle_intelligence_rate_limits enable row level security;
revoke all on table public.oracle_intelligence_rate_limits from public, anon, authenticated;
grant all on table public.oracle_intelligence_rate_limits to service_role;

create or replace function public.check_oracle_intelligence_rate_limit(
  p_session_hash text,
  p_minute_limit integer default 6,
  p_daily_limit integer default 100
)
returns table (
  allowed boolean,
  reason text,
  remaining_minute integer,
  remaining_day integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.oracle_intelligence_rate_limits%rowtype;
  current_time timestamptz := clock_timestamp();
begin
  if p_session_hash !~ '^[0-9a-f]{64}$' or p_minute_limit < 1 or p_daily_limit < 1 then
    raise exception 'invalid rate-limit input';
  end if;

  insert into public.oracle_intelligence_rate_limits (session_hash)
  values (p_session_hash)
  on conflict (session_hash) do nothing;

  select * into current_row
  from public.oracle_intelligence_rate_limits
  where session_hash = p_session_hash
  for update;

  if current_time - current_row.minute_started_at >= interval '1 minute' then
    current_row.minute_started_at := current_time;
    current_row.minute_count := 0;
  end if;
  if current_time - current_row.day_started_at >= interval '1 day' then
    current_row.day_started_at := current_time;
    current_row.day_count := 0;
  end if;

  if current_row.day_count >= p_daily_limit then
    return query select false, 'daily_soft_limit'::text, greatest(0, p_minute_limit - current_row.minute_count), 0;
    return;
  end if;
  if current_row.minute_count >= p_minute_limit then
    return query select false, 'short_window'::text, 0, greatest(0, p_daily_limit - current_row.day_count);
    return;
  end if;

  current_row.minute_count := current_row.minute_count + 1;
  current_row.day_count := current_row.day_count + 1;
  update public.oracle_intelligence_rate_limits
  set minute_started_at = current_row.minute_started_at,
      minute_count = current_row.minute_count,
      day_started_at = current_row.day_started_at,
      day_count = current_row.day_count,
      updated_at = current_time
  where session_hash = p_session_hash;

  if get_byte(decode(substr(p_session_hash, 1, 2), 'hex'), 0) % 100 = 0 then
    delete from public.oracle_intelligence_rate_limits where updated_at < current_time - interval '35 days';
  end if;

  return query select true, null::text,
    greatest(0, p_minute_limit - current_row.minute_count),
    greatest(0, p_daily_limit - current_row.day_count);
end;
$$;

revoke all on function public.check_oracle_intelligence_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_oracle_intelligence_rate_limit(text, integer, integer) to service_role;

create index if not exists oracle_intelligence_rate_limits_updated_at_idx
  on public.oracle_intelligence_rate_limits (updated_at);
