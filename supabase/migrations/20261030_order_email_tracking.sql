-- Apply in Supabase Dashboard → SQL Editor (safe to re-run).
-- Adds:
-- - orders.customer_confirmed_at: when the "Platba prijatá" email reached Resend
-- - orders.admin_notified_at: when the admin "Zaplatená objednávka" email reached Resend
-- Paid orders with a null value show a warning and a resend button in /admin.
-- The app keeps working before this is applied; it only logs
-- ORDER_EMAIL_STATUS_UPDATE_ERROR until the columns exist.

alter table public.orders
  add column if not exists customer_confirmed_at timestamptz;

alter table public.orders
  add column if not exists admin_notified_at timestamptz;

-- Orders paid before this migration were handled under the old flow (email
-- results were not recorded); mark them as sent so /admin does not flag every
-- historical order. Apply this migration BEFORE deploying the code that writes
-- these columns. Re-running is harmless: coalesce keeps any recorded value.
update public.orders
set
  customer_confirmed_at = coalesce(customer_confirmed_at, paid_at),
  admin_notified_at = coalesce(admin_notified_at, paid_at)
where payment_status = 'paid'
  and paid_at is not null;

notify pgrst, 'reload schema';
