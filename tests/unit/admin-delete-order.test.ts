import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = await vi.hoisted(async () => {
  const { vi: hoistedVi } = await import("vitest");
  const { createFakeSupabase } = await import("./helpers/fake-supabase");

  return {
    supabase: createFakeSupabase(),
    currentUserEmail: "admin@example.com" as string | null,
    sessionsRetrieve: hoistedVi.fn(),
    sessionsExpire: hoistedVi.fn(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: mocks.supabase.client }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: mocks.currentUserEmail ? { email: mocks.currentUserEmail } : null,
        },
        error: null,
      }),
    },
  }),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: { retrieve: mocks.sessionsRetrieve, expire: mocks.sessionsExpire },
    },
  },
}));

const { DELETE } = await import("@/app/api/admin/orders/[orderId]/route");

function deleteRequest(origin = "https://www.annum.sk") {
  return DELETE(
    new Request("https://www.annum.sk/api/admin/orders/order-1", {
      method: "DELETE",
      headers: { origin },
    }),
    { params: Promise.resolve({ orderId: "order-1" }) },
  );
}

function seedOrder(overrides: Record<string, unknown> = {}) {
  mocks.supabase.tables.orders!.push({
    id: "order-1",
    payment_status: "pending",
    stripe_checkout_session_id: "cs_test_1",
    photos: [{ name: "a.jpg", type: "image/jpeg", size: 1, path: "orders/2026-007/1-a.jpg" }],
    ...overrides,
  });
}

function orderExists() {
  return mocks.supabase.tables.orders!.some((row) => row.id === "order-1");
}

beforeEach(() => {
  process.env.ADMIN_EMAILS = "admin@example.com";
  process.env.NEXT_PUBLIC_APP_URL = "https://www.annum.sk";
  mocks.currentUserEmail = "admin@example.com";
  mocks.supabase.reset();
  mocks.sessionsRetrieve
    .mockReset()
    .mockResolvedValue({ id: "cs_test_1", status: "open", payment_status: "unpaid" });
  mocks.sessionsExpire.mockReset().mockResolvedValue({ id: "cs_test_1", status: "expired" });
});

describe("DELETE /api/admin/orders/[orderId] (H-3)", () => {
  it("rejects cross-site requests", async () => {
    seedOrder();

    expect((await deleteRequest("https://evil.example")).status).toBe(403);
    expect(orderExists()).toBe(true);
  });

  it("rejects users outside the admin allowlist", async () => {
    seedOrder();
    mocks.currentUserEmail = "someone@example.com";

    expect((await deleteRequest()).status).toBe(401);
    expect(orderExists()).toBe(true);
  });

  it("refuses to delete a paid order and leaves Stripe and photos alone", async () => {
    seedOrder({ payment_status: "paid" });

    const response = await deleteRequest();

    expect(response.status).toBe(409);
    expect(orderExists()).toBe(true);
    expect(mocks.sessionsRetrieve).not.toHaveBeenCalled();
    expect(mocks.supabase.storageRemove).toEqual([]);
  });

  it("expires an open Checkout session, then deletes the order and its photos", async () => {
    seedOrder();

    const response = await deleteRequest();

    expect(response.status).toBe(200);
    expect(mocks.sessionsExpire).toHaveBeenCalledWith("cs_test_1");
    expect(orderExists()).toBe(false);
    expect(mocks.supabase.storageRemove).toEqual([["orders/2026-007/1-a.jpg"]]);
  });

  it("refuses when the session is already complete (payment done or processing)", async () => {
    seedOrder();
    mocks.sessionsRetrieve.mockResolvedValue({
      id: "cs_test_1",
      status: "complete",
      payment_status: "unpaid",
    });

    expect((await deleteRequest()).status).toBe(409);
    expect(orderExists()).toBe(true);
    expect(mocks.sessionsExpire).not.toHaveBeenCalled();
  });

  it("refuses when the customer completes payment while the session is being expired", async () => {
    seedOrder();
    mocks.sessionsExpire.mockRejectedValue(new Error("session is not open"));
    mocks.sessionsRetrieve
      .mockResolvedValueOnce({ id: "cs_test_1", status: "open", payment_status: "unpaid" })
      .mockResolvedValueOnce({ id: "cs_test_1", status: "complete", payment_status: "paid" });

    expect((await deleteRequest()).status).toBe(409);
    expect(orderExists()).toBe(true);
  });

  it("does not delete when Stripe cannot be reached", async () => {
    seedOrder();
    mocks.sessionsRetrieve.mockRejectedValue(new Error("network error"));

    expect((await deleteRequest()).status).toBe(502);
    expect(orderExists()).toBe(true);
  });

  it("deletes when the session is unknown to this Stripe account", async () => {
    seedOrder();
    mocks.sessionsRetrieve.mockRejectedValue(
      Object.assign(new Error("No such checkout.session"), { code: "resource_missing" }),
    );

    expect((await deleteRequest()).status).toBe(200);
    expect(orderExists()).toBe(false);
  });

  it("deletes an unpaid order without a session without calling Stripe", async () => {
    seedOrder({ stripe_checkout_session_id: null });

    expect((await deleteRequest()).status).toBe(200);
    expect(mocks.sessionsRetrieve).not.toHaveBeenCalled();
    expect(orderExists()).toBe(false);
  });
});
