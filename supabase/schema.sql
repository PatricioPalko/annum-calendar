-- Annum calendar – Supabase schema
-- Run once in Supabase Dashboard → SQL Editor (or via Supabase CLI).
--
-- Prerequisites:
-- - Supabase project with Auth enabled for admin users
-- - Service role key used only on the server (NEXT_PUBLIC_* must stay publishable/anon)

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  order_number integer not null,
  order_code text not null,
  storage_folder text not null,

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  note text,
  delivery_wave_key text,

  calendar_type text not null
    check (calendar_type in ('basic', 'premium', 'memory', 'business')),
  quantity integer not null check (quantity > 0 and quantity <= 200),
  total_price numeric(10, 2),
  discount_code text,
  discount_amount numeric(10, 2),

  photos jsonb not null default '[]'::jsonb,
  birthdays jsonb not null default '[]'::jsonb,
  namedays jsonb not null default '[]'::jsonb,

  payment_status text not null default 'pending',
  paid_at timestamptz,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,

  status text not null default 'new',
  downloaded_at timestamptz,
  completed_at timestamptz,
  ready_at timestamptz,
  shipped_at timestamptz,

  delivery_method text
    check (delivery_method is null or delivery_method in ('pickup', 'packeta')),
  delivery_price numeric(10, 2),
  packeta_point_id text,
  packeta_point_name text,
  packeta_point_address text,
  tracking_number text,

  terms_accepted_at timestamptz,
  marketing_consent_at timestamptz,

  memory_set_enabled boolean not null default false,
  dedications jsonb not null default '[]'::jsonb,
  dedication text,

  constraint orders_order_code_key unique (order_code),
  constraint orders_order_number_key unique (order_number)
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

create index if not exists orders_status_idx
  on public.orders (status);

create index if not exists orders_delivery_wave_key_idx
  on public.orders (delivery_wave_key);

alter table public.orders enable row level security;

-- No SELECT/INSERT/UPDATE policies for anon or authenticated roles.
-- The Next.js backend uses the service role key and enforces access in app code.

-- ---------------------------------------------------------------------------
-- Order number sequence + RPC (used by /api/uploads/sign)
-- ---------------------------------------------------------------------------

create sequence if not exists public.order_number_seq
  as integer
  start with 1
  increment by 1
  no maxvalue
  cache 1;

create or replace function public.next_order_number()
returns integer
language sql
security definer
set search_path = public
as $$
  select nextval('public.order_number_seq')::integer;
$$;

revoke all on function public.next_order_number() from public;
grant execute on function public.next_order_number() to service_role;

-- ---------------------------------------------------------------------------
-- Storage bucket for customer photo uploads
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'calendar-uploads',
  'calendar-uploads',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads use signed URLs generated server-side with the service role.
-- Do not add public read/list policies on this bucket.

-- ---------------------------------------------------------------------------
-- Incremental patches (safe to re-run on existing databases)
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists terms_accepted_at timestamptz;

alter table public.orders
  add column if not exists marketing_consent_at timestamptz;

alter table public.orders
  add column if not exists ready_at timestamptz;

alter table public.orders
  add column if not exists shipped_at timestamptz;

alter table public.orders
  add column if not exists tracking_number text;

alter table public.orders
  add column if not exists packeta_point_id text;

alter table public.orders
  add column if not exists packeta_point_name text;

alter table public.orders
  add column if not exists packeta_point_address text;

alter table public.orders
  add column if not exists delivery_method text;

alter table public.orders
  add column if not exists delivery_price numeric(10, 2);

alter table public.orders
  add column if not exists delivery_wave_key text;

alter table public.orders
  add column if not exists stripe_checkout_session_id text;

alter table public.orders
  add column if not exists stripe_payment_intent_id text;

alter table public.orders
  add column if not exists discount_code text;

alter table public.orders
  add column if not exists discount_amount numeric(10, 2);

alter table public.orders
  add column if not exists memory_set_enabled boolean not null default false;

alter table public.orders
  add column if not exists dedications jsonb not null default '[]'::jsonb;

alter table public.orders
  add column if not exists dedication text;

alter table public.orders drop constraint if exists orders_calendar_type_check;

alter table public.orders
  add constraint orders_calendar_type_check
  check (calendar_type in ('basic', 'premium', 'memory', 'business'));

alter table public.orders
  add column if not exists downloaded_at timestamptz;

alter table public.orders
  add column if not exists completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Rate limiting (shared across serverless instances)
-- ---------------------------------------------------------------------------

create table if not exists public.rate_limit_counters (
  scope text not null,
  counter_key text not null,
  window_start bigint not null,
  count integer not null default 1,
  primary key (scope, counter_key, window_start)
);

create index if not exists rate_limit_counters_window_idx
  on public.rate_limit_counters (window_start);

alter table public.rate_limit_counters enable row level security;

create or replace function public.consume_rate_limit(
  p_scope text,
  p_key text,
  p_window_ms bigint,
  p_max integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now_ms bigint;
  v_window_start bigint;
  v_count integer;
  v_retry_after_ms bigint;
begin
  v_now_ms := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_window_start := (v_now_ms / p_window_ms) * p_window_ms;

  -- Drop prior windows for this key so the table does not grow unboundedly.
  delete from public.rate_limit_counters
  where scope = p_scope
    and counter_key = p_key
    and window_start < v_window_start;

  -- Opportunistic global prune of counters older than 24 hours.
  if (v_now_ms % 100) = 0 then
    delete from public.rate_limit_counters
    where window_start < v_now_ms - 86400000;
  end if;

  insert into public.rate_limit_counters (scope, counter_key, window_start, count)
  values (p_scope, p_key, v_window_start, 1)
  on conflict (scope, counter_key, window_start)
  do update set count = public.rate_limit_counters.count + 1
  returning count into v_count;

  if v_count > p_max then
    v_retry_after_ms := p_window_ms - (v_now_ms - v_window_start);

    return jsonb_build_object(
      'ok', false,
      'remaining', 0,
      'retry_after_ms', greatest(v_retry_after_ms, 0)
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'remaining', p_max - v_count,
    'retry_after_ms', 0
  );
end;
$$;

revoke all on function public.consume_rate_limit(text, text, bigint, integer)
  from public;
grant execute on function public.consume_rate_limit(text, text, bigint, integer)
  to service_role;
