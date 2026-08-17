-- Partners (B2B customers: OTAs, HR platforms, insurers) and their API keys.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- PARTNERS
-- One row per signed-up company, linked 1:1 to a Supabase Auth user.
-- Tier drives the rate limit applied in the Edge Function.
-- ─────────────────────────────────────────────

create type partner_tier as enum ('trial', 'paid');

create table public.partners (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  tier         partner_tier not null default 'trial',
  created_at   timestamptz default now()
);

alter table public.partners enable row level security;

-- a logged-in partner can see and update only their own row
create policy "Partners manage their own record"
  on public.partners for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- API KEYS
-- Same pattern as the consumer-facing template: store a SHA-256 fingerprint,
-- never the raw key. Prefix is safe to show in the dashboard.
-- ─────────────────────────────────────────────

create table public.api_keys (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  key_name   text not null,
  key_hash   text not null,
  prefix     text not null,
  created_at timestamptz default now()
);

alter table public.api_keys enable row level security;

-- a logged-in partner can only ever see and manage their own keys
create policy "Partners manage their own API keys"
  on public.api_keys for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- KEY GENERATOR
-- Requires the caller to already have a partners row (i.e. finished signup).
-- Returns the raw key ONCE; only the hash is ever persisted.
-- ─────────────────────────────────────────────

create or replace function generate_api_key(key_name text)
returns text
language plpgsql
security definer
as $$
declare
  raw_key    text;
  hashed_key text;
  key_prefix text;
begin
  if not exists (select 1 from public.partners where user_id = auth.uid()) then
    raise exception 'No partner record for this account. Complete signup first.';
  end if;

  raw_key    := 'sk_live_' || encode(gen_random_bytes(16), 'hex');
  hashed_key := encode(digest(raw_key, 'sha256'), 'hex');
  key_prefix := substring(raw_key from 1 for 12);

  insert into public.api_keys (user_id, key_name, key_hash, prefix)
  values (auth.uid(), key_name, hashed_key, key_prefix);

  return raw_key;
end;
$$;
