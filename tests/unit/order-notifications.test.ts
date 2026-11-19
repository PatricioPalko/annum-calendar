import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = await vi.hoisted(async () => {
  const { vi: hoistedVi } = await import("vitest");
  const { createFakeSupabase } = await import("./helpers/fake-supabase");

  return {
    supabase: createFakeSupabase(),
    sendOrderReceivedEmails: hoistedVi.fn(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: mocks.supabase.client }));

vi.mock("@/lib/order-emails", () => ({
  sendOrderReceivedEmails: mocks.sendOrderReceivedEmails,
}));

const { resendMissingOrderEmails } = await import("@/lib/order-notifications");

function seedOrder(overrides: Record<string, unknown> = {}) {
  mocks.supabase.tables.orders!.push({
    id: "order-1",
    order_code: "testovaci-test-2026-p3-abcd",
    order_number: 7,
    first_name: "Test",
    last_name: "Testovací",
    email: "customer@example.com",
    phone: null,
    note: null,
    calendar_type: "premium",
    quantity: 3,
    // Premium 3 ks (83.70) − ANNUM20 (16.74), pickup 0 €
    total_price: 66.96,
    delivery_price: 0,
    delivery_method: "pickup",
    delivery_wave_key: "batch-2026-november",
    payment_status: "offline",
    payment_method: "bank_transfer",
    discount_code: "ANNUM20",
    discount_amount: 16.74,
    photos: [],
    birthdays: [],
    namedays: [],
    dedications: [],
    customer_confirmed_at: null,
    admin_notified_at: null,
    ...overrides,
  });
}

function orderRow() {
  return mocks.supabase.tables.orders![0]!;
}

beforeEach(() => {
  mocks.supabase.reset();
  mocks.sendOrderReceivedEmails.mockReset().mockImplementation(async (_params, options) => ({
    customerSent: options.customer ?? true,
    adminSent: options.admin ?? true,
  }));
});

describe("resendMissingOrderEmails", () => {
  it("sends both emails for a new offline order and records them", async () => {
    seedOrder();

    const result = await resendMissingOrderEmails("order-1", { idempotencyKeyPrefix: "order-created/order-1" });

    expect(result).toMatchObject({ status: "sent", customerSent: true, adminSent: true });
    expect(mocks.sendOrderReceivedEmails).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        orderCode: "testovaci-test-2026-p3-abcd",
        orderNumber: 7,
        paymentMethod: "bank_transfer",
        totalPrice: 66.96,
      }),
      { customer: true, admin: true, idempotencyKeyPrefix: "order-created/order-1" },
    );
    expect(orderRow().customer_confirmed_at).toEqual(expect.any(String));
    expect(orderRow().admin_notified_at).toEqual(expect.any(String));
  });

  it("passes the pre-discount goods price so the email breakdown adds up (N-3)", async () => {
    seedOrder();

    await resendMissingOrderEmails("order-1");

    const [params] = mocks.sendOrderReceivedEmails.mock.calls[0]!;
    expect(params.goodsPrice).toBeCloseTo(83.7, 2);
    expect(params.goodsPrice - params.discountAmount).toBeCloseTo(params.totalPrice, 2);
  });

  it("records only the email that was sent, so the other can be resent (H-4)", async () => {
    seedOrder();
    mocks.sendOrderReceivedEmails.mockResolvedValue({
      customerSent: false,
      adminSent: true,
      customerError: new Error("resend down"),
    });

    await resendMissingOrderEmails("order-1");

    expect(orderRow().customer_confirmed_at).toBeNull();
    expect(orderRow().admin_notified_at).toEqual(expect.any(String));

    mocks.sendOrderReceivedEmails.mockClear().mockImplementation(async (_params, options) => ({
      customerSent: options.customer ?? true,
      adminSent: options.admin ?? true,
    }));

    const retry = await resendMissingOrderEmails("order-1");

    expect(retry).toMatchObject({ status: "sent", customerRequested: true, adminRequested: false });
    expect(mocks.sendOrderReceivedEmails.mock.calls[0]![1]).toMatchObject({ customer: true, admin: false });
  });

  it("does nothing when both emails were already sent", async () => {
    seedOrder({ customer_confirmed_at: "2026-11-19T10:00:00Z", admin_notified_at: "2026-11-19T10:00:00Z" });

    expect(await resendMissingOrderEmails("order-1")).toEqual({ status: "nothing_to_send" });
    expect(mocks.sendOrderReceivedEmails).not.toHaveBeenCalled();
  });

  it.each([
    ["an older online order", { payment_status: "paid", payment_method: null }],
    ["an unfinished online order", { payment_status: "pending", payment_method: null }],
    ["an offline order without a valid method", { payment_method: "card" }],
  ])("refuses %s", async (_label, overrides) => {
    seedOrder(overrides);

    expect(await resendMissingOrderEmails("order-1")).toEqual({ status: "not_eligible" });
    expect(mocks.sendOrderReceivedEmails).not.toHaveBeenCalled();
  });

  it("reports a missing order", async () => {
    expect(await resendMissingOrderEmails("missing")).toEqual({ status: "not_found" });
  });
});
