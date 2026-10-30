import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = await vi.hoisted(async () => {
  const { vi: hoistedVi } = await import("vitest");
  const { createFakeSupabase } = await import("./helpers/fake-supabase");

  return {
    supabase: createFakeSupabase(),
    sendOrderPaidEmail: hoistedVi.fn(),
    sendAdminAlertEmail: hoistedVi.fn(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: mocks.supabase.client }));

vi.mock("@/lib/order-emails", () => ({
  sendOrderPaidEmail: mocks.sendOrderPaidEmail,
  sendAdminAlertEmail: mocks.sendAdminAlertEmail,
}));

vi.mock("@/lib/stripe", () => ({ stripe: {} }));

const { POST } = await import("@/app/api/cron/retry-paid-emails/route");

const SECRET = "vitest-cron-secret";
const MINUTE = 60 * 1000;

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * MINUTE).toISOString();
}

function seedOrder(id: string, overrides: Record<string, unknown> = {}) {
  mocks.supabase.tables.orders!.push({
    id,
    order_code: `testovaci-test-2026-b1-${id}`,
    first_name: "Test",
    last_name: "Testovací",
    email: "test@example.com",
    calendar_type: "basic",
    quantity: 1,
    total_price: 30.9,
    delivery_price: 3.9,
    delivery_method: "packeta",
    payment_status: "paid",
    paid_at: minutesAgo(30),
    customer_confirmed_at: null,
    admin_notified_at: null,
    ...overrides,
  });
}

function order(id: string) {
  return mocks.supabase.tables.orders!.find((row) => row.id === id)!;
}

function callCron(authorization: string | null = `Bearer ${SECRET}`) {
  return POST(
    new Request("https://www.annum.sk/api/cron/retry-paid-emails", {
      method: "POST",
      headers: authorization ? { authorization } : {},
    }),
  );
}

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
  mocks.supabase.reset();
  mocks.sendOrderPaidEmail.mockReset().mockImplementation(async (_params, options) => ({
    customerSent: options.customer ?? true,
    adminSent: options.admin ?? true,
  }));
  mocks.sendAdminAlertEmail.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/cron/retry-paid-emails (H-4)", () => {
  it("returns 503 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    seedOrder("a");

    expect((await callCron()).status).toBe(503);
    expect(mocks.sendOrderPaidEmail).not.toHaveBeenCalled();
  });

  it.each([null, "Bearer wrong", SECRET, `Bearer ${SECRET}x`])(
    "rejects authorization %j with 401",
    async (authorization) => {
      seedOrder("a");

      expect((await callCron(authorization)).status).toBe(401);
      expect(mocks.sendOrderPaidEmail).not.toHaveBeenCalled();
    },
  );

  it("resends only the missing email, with an hourly idempotency key, and records it", async () => {
    seedOrder("a", { customer_confirmed_at: minutesAgo(29) });

    const response = await callCron();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ checked: 1, sent: 1, failed: 0 });
    expect(mocks.sendOrderPaidEmail).toHaveBeenCalledOnce();

    const options = mocks.sendOrderPaidEmail.mock.calls[0]![1];
    const hourBucket = Math.floor(Date.now() / (60 * MINUTE));
    expect(options).toEqual({
      customer: false,
      admin: true,
      idempotencyKeyPrefix: `order-paid-retry/a/${hourBucket}`,
    });
    expect(order("a").admin_notified_at).toEqual(expect.any(String));
  });

  it("skips orders that are unpaid, fully notified, too recent or too old", async () => {
    seedOrder("unpaid", { payment_status: "pending" });
    seedOrder("done", { customer_confirmed_at: minutesAgo(29), admin_notified_at: minutesAgo(29) });
    seedOrder("recent", { paid_at: minutesAgo(2) });
    seedOrder("old", { paid_at: minutesAgo(8 * 24 * 60) });
    seedOrder("never-paid", { paid_at: null });

    const response = await callCron();

    expect(await response.json()).toEqual({ checked: 0, sent: 0, failed: 0 });
    expect(mocks.sendOrderPaidEmail).not.toHaveBeenCalled();
  });

  it("processes at most 20 orders per run, oldest first", async () => {
    for (let index = 0; index < 25; index += 1) {
      seedOrder(`o${index}`, { paid_at: minutesAgo(100 - index) });
    }

    expect(await (await callCron()).json()).toEqual({ checked: 20, sent: 20, failed: 0 });
    expect(order("o0").customer_confirmed_at).toEqual(expect.any(String));
    expect(order("o24").customer_confirmed_at).toBeNull();
  });

  it("counts a failed resend and alerts the operator with the order id only", async () => {
    seedOrder("a");
    mocks.sendOrderPaidEmail.mockResolvedValue({
      customerSent: false,
      adminSent: true,
      customerError: new Error("resend down"),
    });

    const response = await callCron();

    expect(await response.json()).toEqual({ checked: 1, sent: 0, failed: 1 });
    expect(order("a").customer_confirmed_at).toBeNull();
    expect(mocks.sendAdminAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ code: "PAID_ORDER_EMAIL_RETRY_FAILED", orderId: "a" }),
    );
  });

  it("does not expose order ids in the response", async () => {
    seedOrder("secret-order-id");

    const body = await (await callCron()).text();

    expect(body).not.toContain("secret-order-id");
  });
});
