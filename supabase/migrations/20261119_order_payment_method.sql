-- Apply in Supabase Dashboard → SQL Editor (safe to re-run).
-- Online payments (Stripe) and Packeta delivery were removed: customers
-- pick up in person and pay by bank transfer or in cash.
-- Adds orders.payment_method ('bank_transfer' | 'cash'; null for older Stripe
-- orders). New orders are stored with payment_status = 'offline'.
-- Apply this migration BEFORE deploying the code that writes the column,
-- otherwise every new order fails to save.

alter table public.orders
  add column if not exists payment_method text;

alter table public.orders drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method is null or payment_method in ('bank_transfer', 'cash'));

notify pgrst, 'reload schema';
