-- Apply in Supabase Dashboard → SQL Editor (safe to re-run).
-- Fixes:
-- - security definer RPCs callable by the anon / authenticated roles.
--   `revoke ... from public` does not remove the explicit grants Supabase's
--   default privileges give these roles, so anyone holding the publishable key
--   could call /rest/v1/rpc/consume_rate_limit and /rest/v1/rpc/next_order_number.
--   Only the server (service_role) calls them.

-- ---------------------------------------------------------------------------
-- Check before / after (read-only):
--
-- select has_function_privilege('anon', 'public.consume_rate_limit(text,text,bigint,integer)', 'execute') as anon_rate_limit,
--        has_function_privilege('authenticated', 'public.consume_rate_limit(text,text,bigint,integer)', 'execute') as auth_rate_limit,
--        has_function_privilege('anon', 'public.next_order_number()', 'execute') as anon_next_number,
--        has_function_privilege('authenticated', 'public.next_order_number()', 'execute') as auth_next_number,
--        has_function_privilege('service_role', 'public.consume_rate_limit(text,text,bigint,integer)', 'execute') as service_rate_limit,
--        has_function_privilege('service_role', 'public.next_order_number()', 'execute') as service_next_number;
--
-- Expected after this migration: anon_* and auth_* = false, service_* = true.
-- ---------------------------------------------------------------------------

revoke execute on function public.next_order_number()
  from public, anon, authenticated;

grant execute on function public.next_order_number() to service_role;

revoke execute on function public.consume_rate_limit(text, text, bigint, integer)
  from public, anon, authenticated;

grant execute on function public.consume_rate_limit(text, text, bigint, integer)
  to service_role;

notify pgrst, 'reload schema';
