import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = await vi.hoisted(async () => {
  const { vi: hoistedVi } = await import("vitest");
  const { createFakeSupabase } = await import("./helpers/fake-supabase");

  return {
    supabase: createFakeSupabase(),
    afterTasks: [] as Array<() => Promise<void>>,
    refundsCreate: hoistedVi.fn(),
    sendOrderPaidEmail: hoistedVi.fn(),
    sendAdminAlertEmail: hoistedVi.fn(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: mocks.supabase.client }));

vi.mock("@/lib/order-emails", () => ({
  sendOrderPaidEmail: mocks.sendOrderPaidEmail,
  sendAdminAlertEmail: mocks.sendAdminAlertEmail,
}));

vi.mock("@/lib/stripe", async () => {
  const { default: RealStripe } = await import("stripe");
  // Real signature verification (pure crypto, no network); refunds are mocked.
  const real = new RealStripe("sk_test_vitest");

  return {
    stripe: { webhooks: real.webhooks, refunds: { create: mocks.refundsCreate } },
  };
});

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (task: () => Promise<void>) => {
    mocks.afterTasks.push(task);
  },
}));

const { markOrderPaidFromCheckoutSession, resendMissingPaidOrderEmails } =
  await import("@/lib/order-payments");
const { POST: webhookPOST } = await import("@/app/api/stripe/webhook/route");

const signer = new Stripe("sk_test_vitest");
const WEBHOOK_SECRET = "whsec_vitest";

async function flushAfterTasks() {
  while (mocks.afterTasks.length > 0) {
    await mocks.afterTasks.shift()!();
  }
}

function seedOrder(overrides: Record<string, unknown> = {}) {
  const row = {
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
    // Premium 3 ks (83.70) − ANNUM10 (8.37) + Packeta (3.90)
    total_price: 79.23,
    delivery_price: 3.9,
    delivery_method: "packeta",
    delivery_wave_key: "batch-2026-november",
    packeta_point_id: "12345",
    packeta_point_name: "Z-BOX Test",
    packeta_point_address: "Testovacia 1, Košice",
    tracking_number: null,
    payment_status: "pending",
    paid_at: null,
    stripe_checkout_session_id: "cs_test_1",
    stripe_payment_intent_id: null,
    discount_code: "ANNUM10",
    discount_amount: 8.37,
    photos: [],
    birthdays: [],
    namedays: [],
    dedications: [],
    customer_confirmed_at: null,
    admin_notified_at: null,
    ...overrides,
  };

  mocks.supabase.tables.orders!.push(row);
  return row;
}

function checkoutSession(
  overrides: Partial<Record<keyof Stripe.Checkout.Session, unknown>> = {},
) {
  return {
    id: "cs_test_1",
    object: "checkout.session",
    status: "complete",
    payment_status: "paid",
    amount_total: 7923,
    currency: "eur",
    payment_intent: "pi_test_1",
    metadata: { orderId: "order-1", orderCode: "testovaci-test-2026-p3-abcd" },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

function orderRow() {
  return mocks.supabase.tables.orders!.find((row) => row.id === "order-1");
}

beforeEach(() => {
  mocks.supabase.reset();
  mocks.afterTasks.length = 0;
  mocks.refundsCreate.mockReset().mockResolvedValue({ id: "re_test_1" });
  mocks.sendOrderPaidEmail
    .mockReset()
    .mockResolvedValue({ customerSent: true, adminSent: true });
  mocks.sendAdminAlertEmail.mockReset().mockResolvedValue(undefined);
});

describe("markOrderPaidFromCheckoutSession", () => {
  it("marks a pending order paid and sends both emails once, after the response", async () => {
    seedOrder();

    const result = await markOrderPaidFromCheckoutSession(checkoutSession());

    expect(result.status).toBe("marked");
    expect(orderRow()).toMatchObject({
      payment_status: "paid",
      stripe_checkout_session_id: "cs_test_1",
      stripe_payment_intent_id: "pi_test_1",
    });
    expect(orderRow()?.paid_at).toEqual(expect.any(String));

    // Emails are deferred until after the response.
    expect(mocks.sendOrderPaidEmail).not.toHaveBeenCalled();
    await flushAfterTasks();

    expect(mocks.sendOrderPaidEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendOrderPaidEmail.mock.calls[0]![1]).toEqual({
      idempotencyKeyPrefix: "order-paid/order-1",
    });
    expect(orderRow()?.customer_confirmed_at).toEqual(expect.any(String));
    expect(orderRow()?.admin_notified_at).toEqual(expect.any(String));
  });

  it("passes the pre-discount goods price so the email breakdown adds up (N-3)", async () => {
    seedOrder();

    await markOrderPaidFromCheckoutSession(checkoutSession());
    await flushAfterTasks();

    const emailParams = mocks.sendOrderPaidEmail.mock.calls[0]![0];

    expect(emailParams.goodsPrice).toBeCloseTo(83.7, 2);
    expect(
      emailParams.goodsPrice - emailParams.discountAmount + emailParams.delivery.price,
    ).toBeCloseTo(emailParams.totalPrice, 2);
  });

  it("treats a replay of the same session as already paid without side effects", async () => {
    seedOrder({ payment_status: "paid", paid_at: "2026-10-30T10:00:00.000Z" });

    const result = await markOrderPaidFromCheckoutSession(checkoutSession());
    await flushAfterTasks();

    expect(result.status).toBe("already_paid");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
    expect(mocks.sendOrderPaidEmail).not.toHaveBeenCalled();
  });

  it("refunds a second, different paid session for an already paid order", async () => {
    seedOrder({ payment_status: "paid" });

    const result = await markOrderPaidFromCheckoutSession(
      checkoutSession({ id: "cs_test_2", payment_intent: "pi_test_2" }),
    );
    await flushAfterTasks();

    expect(result.status).toBe("already_paid");
    expect(mocks.refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_test_2", reason: "duplicate" }),
      { idempotencyKey: "duplicate-refund:cs_test_2" },
    );
    expect(mocks.sendAdminAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ code: "DUPLICATE_PAYMENT_REFUNDED" }),
    );
    expect(mocks.sendOrderPaidEmail).not.toHaveBeenCalled();
  });

  it("fails (so Stripe retries) when the duplicate refund cannot be confirmed", async () => {
    seedOrder({ payment_status: "paid" });
    mocks.refundsCreate.mockRejectedValue(new Error("stripe unavailable"));

    const result = await markOrderPaidFromCheckoutSession(
      checkoutSession({ id: "cs_test_2", payment_intent: "pi_test_2" }),
    );

    expect(result).toEqual({ status: "error", message: "Duplicate payment refund failed." });
    expect(mocks.refundsCreate).toHaveBeenCalledTimes(3);
  });

  it("does not mark the order paid when the amount does not match", async () => {
    seedOrder();

    const result = await markOrderPaidFromCheckoutSession(
      checkoutSession({ amount_total: 100 }),
    );
    await flushAfterTasks();

    expect(result).toEqual({ status: "error", message: "Payment amount mismatch." });
    expect(orderRow()?.payment_status).toBe("pending");
    expect(mocks.sendAdminAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ code: "PAYMENT_AMOUNT_MISMATCH", orderId: "order-1" }),
    );
  });

  it("does not mark the order paid for a non-EUR payment", async () => {
    seedOrder();

    const result = await markOrderPaidFromCheckoutSession(
      checkoutSession({ currency: "czk" }),
    );

    expect(result.status).toBe("error");
    expect(orderRow()?.payment_status).toBe("pending");
  });

  it("skips sessions that are not paid (e.g. async payment still pending)", async () => {
    seedOrder();

    const result = await markOrderPaidFromCheckoutSession(
      checkoutSession({ payment_status: "unpaid" }),
    );

    expect(result).toEqual({ status: "skipped", reason: "Checkout session is not paid." });
    expect(orderRow()?.payment_status).toBe("pending");
  });

  it("skips sessions without orderId metadata", async () => {
    const result = await markOrderPaidFromCheckoutSession(
      checkoutSession({ metadata: {} }),
    );

    expect(result).toEqual({ status: "skipped", reason: "Missing orderId metadata." });
  });

  it("refunds and alerts when the order no longer exists (H-3)", async () => {
    const result = await markOrderPaidFromCheckoutSession(checkoutSession());
    await flushAfterTasks();

    expect(result).toEqual({
      status: "skipped",
      reason: "Order not found; payment refunded.",
    });
    expect(mocks.refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: "pi_test_1",
        reason: "requested_by_customer",
      }),
      { idempotencyKey: "missing-order-refund:cs_test_1" },
    );
    expect(mocks.sendAdminAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ code: "PAYMENT_FOR_MISSING_ORDER_REFUNDED" }),
    );
  });

  it("fails (so Stripe retries) when the missing-order refund fails", async () => {
    mocks.refundsCreate.mockRejectedValue(new Error("stripe unavailable"));

    const result = await markOrderPaidFromCheckoutSession(checkoutSession());

    expect(result).toEqual({
      status: "error",
      message: "Order not found and refund failed.",
    });
  });

  it("never refunds on a database error during lookup", async () => {
    seedOrder();
    mocks.supabase.failNextQuery();

    const result = await markOrderPaidFromCheckoutSession(checkoutSession());

    expect(result.status).toBe("error");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });

  it("lets exactly one of two concurrent calls mark the order (webhook vs thank-you page)", async () => {
    seedOrder();

    const results = await Promise.all([
      markOrderPaidFromCheckoutSession(checkoutSession()),
      markOrderPaidFromCheckoutSession(checkoutSession()),
    ]);
    await flushAfterTasks();

    expect(results.map((result) => result.status).sort()).toEqual([
      "already_paid",
      "marked",
    ]);
    expect(mocks.sendOrderPaidEmail).toHaveBeenCalledTimes(1);
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });

  it("records only the email that was sent, so the other can be resent (H-4)", async () => {
    seedOrder();
    mocks.sendOrderPaidEmail.mockResolvedValueOnce({
      customerSent: false,
      adminSent: true,
      customerError: new Error("Resend: validation_error"),
    });

    await markOrderPaidFromCheckoutSession(checkoutSession());
    await flushAfterTasks();

    expect(orderRow()?.customer_confirmed_at).toBeNull();
    expect(orderRow()?.admin_notified_at).toEqual(expect.any(String));

    const resend = await resendMissingPaidOrderEmails("order-1");

    expect(resend).toMatchObject({
      status: "sent",
      customerRequested: true,
      adminRequested: false,
      customerSent: true,
    });
    expect(mocks.sendOrderPaidEmail.mock.calls[1]![1]).toEqual({
      customer: true,
      admin: false,
    });
    expect(orderRow()?.customer_confirmed_at).toEqual(expect.any(String));
  });

  it("refuses to resend emails for unpaid orders", async () => {
    seedOrder();

    expect(await resendMissingPaidOrderEmails("order-1")).toEqual({
      status: "not_paid",
    });
    expect(mocks.sendOrderPaidEmail).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/webhook", () => {
  function signedRequest(event: object, secret = WEBHOOK_SECRET) {
    const payload = JSON.stringify(event);
    const signature = signer.webhooks.generateTestHeaderString({ payload, secret });

    return new Request("https://www.annum.sk/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": signature, "content-type": "application/json" },
      body: payload,
    });
  }

  function event(type: string, object: object) {
    return { id: "evt_test_1", object: "event", type, data: { object } };
  }

  it("rejects requests without a signature", async () => {
    const response = await webhookPOST(
      new Request("https://www.annum.sk/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects a forged signature without touching the order", async () => {
    seedOrder();

    const response = await webhookPOST(
      signedRequest(event("checkout.session.completed", checkoutSession()), "whsec_wrong"),
    );

    expect(response.status).toBe(400);
    expect(orderRow()?.payment_status).toBe("pending");
  });

  it("marks the order paid for a signed checkout.session.completed event", async () => {
    seedOrder();

    const response = await webhookPOST(
      signedRequest(event("checkout.session.completed", checkoutSession())),
    );

    expect(response.status).toBe(200);
    expect(orderRow()?.payment_status).toBe("paid");
  });

  it("returns 500 so Stripe retries when a duplicate refund fails", async () => {
    seedOrder({ payment_status: "paid" });
    mocks.refundsCreate.mockRejectedValue(new Error("stripe unavailable"));

    const response = await webhookPOST(
      signedRequest(
        event(
          "checkout.session.completed",
          checkoutSession({ id: "cs_test_2", payment_intent: "pi_test_2" }),
        ),
      ),
    );

    expect(response.status).toBe(500);
  });

  it("marks the order failed when its current session expires", async () => {
    seedOrder();

    const response = await webhookPOST(
      signedRequest(
        event(
          "checkout.session.expired",
          checkoutSession({ status: "expired", payment_status: "unpaid" }),
        ),
      ),
    );

    expect(response.status).toBe(200);
    expect(orderRow()?.payment_status).toBe("failed");
  });

  it("ignores expiry of a stale session", async () => {
    seedOrder({ stripe_checkout_session_id: "cs_test_current" });

    await webhookPOST(
      signedRequest(
        event(
          "checkout.session.expired",
          checkoutSession({ id: "cs_test_old", status: "expired", payment_status: "unpaid" }),
        ),
      ),
    );

    expect(orderRow()?.payment_status).toBe("pending");
  });

  it("acknowledges unrelated event types", async () => {
    const response = await webhookPOST(
      signedRequest(event("customer.created", { id: "cus_test_1", object: "customer" })),
    );

    expect(response.status).toBe(200);
  });
});
