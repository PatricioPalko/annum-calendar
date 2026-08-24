-- Apply in Supabase Dashboard → SQL Editor (safe to re-run).
-- Fixes:
-- - missing orders.dedication / dedications / memory_set_enabled / delivery_wave_key
-- - missing public.consume_rate_limit RPC used by upload + order rate limiting

-- ---------------------------------------------------------------------------
-- Orders columns
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists delivery_wave_key text;

alter table public.orders
  add column if not exists memory_set_enabled boolean not null default false;

alter table public.orders
  add column if not exists dedications jsonb not null default '[]'::jsonb;

alter table public.orders
  add column if not exists dedication text;

create index if not exists orders_delivery_wave_key_idx
  on public.orders (delivery_wave_key);

alter table public.orders drop constraint if exists orders_calendar_type_check;

alter table public.orders
  add constraint orders_calendar_type_check
  check (calendar_type in ('basic', 'premium', 'memory', 'business'));

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

  delete from public.rate_limit_counters
  where scope = p_scope
    and counter_key = p_key
    and window_start < v_window_start;

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

notify pgrst, 'reload schema';
