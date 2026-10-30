// Placeholder values only, so modules that read env at import time can load.
// Assigned unconditionally so tests behave the same locally and in CI,
// regardless of the shell environment. Tests mock every external client;
// nothing here reaches a real service.
process.env.STRIPE_SECRET_KEY = "sk_test_vitest";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_vitest";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "vitest-publishable-key";
process.env.SUPABASE_SECRET_KEY = "vitest-secret-key";
process.env.NEXT_PUBLIC_APP_URL = "https://www.annum.sk";
process.env.UPLOAD_SIGNING_SECRET = "vitest-upload-signing-secret";
process.env.ORDER_PAYMENT_SIGNING_SECRET = "vitest-order-payment-signing-secret";
