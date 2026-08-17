-- Rate-limit / usage-metering log for the B2B recommendation endpoint.
--
-- Written only by the Edge Function (service role). No policy is defined on
-- purpose: a partner can never insert or read rows here directly, so they
-- can't fake their own request count or see other partners' usage.
--
-- This table doubles as the billing usage log — deliberately does NOT store
-- the traveler profile submitted with each request, only who called and when.

create table public.api_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  endpoint   text not null default 'recommendation',
  status     int,
  created_at timestamptz default now()
);

alter table public.api_requests enable row level security;

-- helpful for the rolling rate-limit window lookup (user_id + recent created_at)
create index api_requests_user_time_idx
  on public.api_requests (user_id, created_at desc);
