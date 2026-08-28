-- QoRacle MVP DATABASE
create table if not exists public.qr_codes (
  code text primary key,
  theme text not null default 'classic',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.scans (
  id bigint generated always as identity primary key,
  qr_code_id text not null references public.qr_codes(code) on delete cascade,
  scanned_at timestamptz not null default now()
);

alter table public.qr_codes enable row level security;
alter table public.scans enable row level security;

-- Public visitors may read active QR codes.
create policy "public can read active qr codes"
on public.qr_codes for select to anon
using (active = true);

-- MVP allows anonymous scan logging.
create policy "public can insert scans"
on public.scans for insert to anon
with check (true);

-- Seed test QR codes.
insert into public.qr_codes(code, theme)
values
  ('DEMO-CLASSIC', 'classic'),
  ('DEMO-CHAOS', 'chaos'),
  ('DEMO-LOVE', 'love'),
  ('DEMO-DARK', 'dark'),
  ('DEMO-DND', 'dnd')
on conflict (code) do nothing;