import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = await vi.hoisted(async () => {
  const { createFakeSupabase } = await import("./helpers/fake-supabase");

  return {
    supabase: createFakeSupabase(),
    currentUserEmail: "admin@example.com" as string | null,
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
    payment_status: "offline",
    payment_method: "cash",
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

  it("refuses to delete an older order paid online and leaves its photos alone", async () => {
    seedOrder({ payment_status: "paid", payment_method: null });

    const response = await deleteRequest();

    expect(response.status).toBe(409);
    expect(orderExists()).toBe(true);
    expect(mocks.supabase.storageRemove).toEqual([]);
  });

  it("deletes an offline-payment order and its photos", async () => {
    seedOrder();

    const response = await deleteRequest();

    expect(response.status).toBe(200);
    expect(orderExists()).toBe(false);
    expect(mocks.supabase.storageRemove).toEqual([["orders/2026-007/1-a.jpg"]]);
  });

  it("deletes an unfinished older online order", async () => {
    seedOrder({ payment_status: "pending", payment_method: null });

    expect((await deleteRequest()).status).toBe(200);
    expect(orderExists()).toBe(false);
  });

  it("returns 404 for an unknown order", async () => {
    expect((await deleteRequest()).status).toBe(404);
  });
});
