import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCalendarPrice } from "@/app/types/types";
import { getDeliveryPrice } from "@/helpers/delivery";
import { getDiscountAmount } from "@/helpers/discount-codes";
import { createFinalizeToken } from "@/lib/upload-finalize-token";

const mocks = await vi.hoisted(async () => {
  const { vi: hoistedVi } = await import("vitest");
  const { createFakeSupabase } = await import("./helpers/fake-supabase");

  return {
    supabase: createFakeSupabase(),
    consumeRateLimit: hoistedVi.fn(),
    getOrCreateOrderCheckoutSession: hoistedVi.fn(),
    sendOrderCreatedEmail: hoistedVi.fn(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: mocks.supabase.client }));

vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  consumeRateLimit: mocks.consumeRateLimit,
}));

vi.mock("@/lib/order-checkout", () => ({
  getOrCreateOrderCheckoutSession: mocks.getOrCreateOrderCheckoutSession,
}));

vi.mock("@/lib/order-emails", () => ({
  sendOrderCreatedEmail: mocks.sendOrderCreatedEmail,
}));

const { POST } = await import("@/app/api/orders/route");

const ORDER_NUMBER = 7;
const STORAGE_FOLDER = "orders/2026-007";
const ORDER_CODE = "testovaci-test-2026-b1-abcd";

function photoPaths(count = 14, folder = STORAGE_FOLDER) {
  return Array.from({ length: count }, (_, index) => `${folder}/${index + 1}-photo.jpg`);
}

function finalizeToken(paths: string[], overrides: { expiresAt?: number } = {}) {
  return createFinalizeToken({
    storageFolder: STORAGE_FOLDER,
    orderNumber: ORDER_NUMBER,
    orderCode: ORDER_CODE,
    photoPaths: paths,
    expiresAt: overrides.expiresAt ?? Math.floor(Date.now() / 1000) + 3600,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  const paths = photoPaths();

  return {
    orderNumber: ORDER_NUMBER,
    orderCode: ORDER_CODE,
    storageFolder: STORAGE_FOLDER,
    finalizeToken: finalizeToken(paths),
    firstName: "Test",
    lastName: "Testovací",
    email: "test@example.com",
    phone: "+421 900 123 456",
    type: "basic",
    quantity: 1,
    photos: paths.map((path) => ({ name: "photo.jpg", type: "image/jpeg", size: 1000, path })),
    birthdays: [],
    namedays: [],
    deliveryMethod: "packeta",
    packetaPoint: { id: "123", name: "Z-BOX Test", address: "Testovacia 1, Košice" },
    termsAccepted: true,
    ...overrides,
  };
}

function withPhotos(paths: string[], tokenPaths = paths) {
  return {
    photos: paths.map((path) => ({ name: "photo.jpg", type: "image/jpeg", size: 1000, path })),
    finalizeToken: finalizeToken(tokenPaths),
  };
}

function createOrder(body: unknown) {
  return POST(
    new Request("https://www.annum.sk/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.1" },
      body: JSON.stringify(body),
    }),
  );
}

async function expectRejected(body: unknown, field: string) {
  const response = await createOrder(body);
  const json = (await response.json()) as { errors?: { fieldErrors?: Record<string, unknown> } };

  expect(response.status).toBe(400);
  expect(json.errors?.fieldErrors?.[field]).toBeDefined();
  expect(mocks.supabase.tables.orders).toHaveLength(0);
  expect(mocks.getOrCreateOrderCheckoutSession).not.toHaveBeenCalled();
}

function expectedTotal(type: "basic" | "premium" | "memory", quantity: 1 | 3 | 5, delivery: "packeta" | "pickup", code?: string) {
  const goods = getCalendarPrice({ type, quantityOption: quantity }).totalPrice;
  const discounted = getDiscountAmount(goods, code).finalPrice;

  return discounted === null ? null : discounted + getDeliveryPrice(delivery);
}

beforeEach(() => {
  mocks.supabase.reset();
  mocks.consumeRateLimit.mockReset().mockResolvedValue({ ok: true, remaining: 4, retryAfterMs: 0 });
  mocks.getOrCreateOrderCheckoutSession
    .mockReset()
    .mockResolvedValue({ status: "ok", url: "https://checkout.stripe.com/c/pay/cs_test_1" });
  mocks.sendOrderCreatedEmail.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/orders (H-6)", () => {
  it("accepts the canonical payload and inserts a pending order with the server total", async () => {
    const response = await createOrder(payload());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      orderId: "generated-1",
      orderCode: ORDER_CODE,
      storageFolder: STORAGE_FOLDER,
      checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1",
    });

    const [order] = mocks.supabase.tables.orders!;
    expect(order).toMatchObject({
      payment_status: "pending",
      total_price: expectedTotal("basic", 1, "packeta"),
      delivery_price: getDeliveryPrice("packeta"),
      packeta_point_id: "123",
      phone: "+421900123456",
    });
    expect(mocks.getOrCreateOrderCheckoutSession).toHaveBeenCalledOnce();
    expect(mocks.sendOrderCreatedEmail).toHaveBeenCalledOnce();
  });

  it("accepts the payload the form sends without a discount code or note (regression)", async () => {
    // The form drops empty optional fields (`value || undefined`), so the keys
    // are missing from the JSON. Zod rejected both missing keys before the
    // fix, which failed every order placed without a note or discount code.
    const body = payload();
    expect(body).not.toHaveProperty("discountCode");
    expect(body).not.toHaveProperty("note");

    const response = await createOrder(body);

    expect(response.status).toBe(200);
    expect(mocks.supabase.tables.orders![0]).toMatchObject({ discount_code: null, note: null });
  });

  it("ignores client-sent prices", async () => {
    const response = await createOrder(
      payload({ type: "premium", quantity: 3, totalPrice: 0.01, deliveryPrice: 0, discountAmount: 999 }),
    );

    expect(response.status).toBe(200);
    expect(mocks.supabase.tables.orders![0]).toMatchObject({
      total_price: expectedTotal("premium", 3, "packeta"),
      delivery_price: getDeliveryPrice("packeta"),
      discount_amount: 0,
    });
  });

  it("applies a valid discount code on the server", async () => {
    const response = await createOrder(payload({ quantity: 5, discountCode: "annum10" }));

    expect(response.status).toBe(200);
    expect(mocks.supabase.tables.orders![0]).toMatchObject({
      total_price: expectedTotal("basic", 5, "packeta", "ANNUM10"),
      discount_code: "ANNUM10",
    });
  });

  it("rejects a photo path outside the order's storage folder", async () => {
    const paths = photoPaths();
    paths[3] = "orders/2026-008/4-photo.jpg";

    await expectRejected(payload(withPhotos(paths)), "photos");
  });

  it("rejects a storage folder that belongs to another order number", async () => {
    await expectRejected(payload({ storageFolder: "orders/2026-008" }), "orderNumber");
  });

  it("rejects a finalize token signed for different photos", async () => {
    const paths = photoPaths();
    const tampered = [...paths];
    tampered[0] = `${STORAGE_FOLDER}/1-other.jpg`;

    await expectRejected(payload(withPhotos(tampered, paths)), "photos");
  });

  it("rejects an expired finalize token", async () => {
    const paths = photoPaths();

    await expectRejected(
      payload({ finalizeToken: finalizeToken(paths, { expiresAt: Math.floor(Date.now() / 1000) - 1 }) }),
      "photos",
    );
  });

  it("rejects fewer photos than the minimum", async () => {
    await expectRejected(payload(withPhotos(photoPaths(13))), "photos");
  });

  it("rejects pickup without a code that allows it", async () => {
    await expectRejected(payload({ deliveryMethod: "pickup", packetaPoint: undefined }), "deliveryMethod");
    await expectRejected(
      payload({ deliveryMethod: "pickup", packetaPoint: undefined, discountCode: "ANNUM10" }),
      "deliveryMethod",
    );
  });

  it("accepts pickup with RODINA15 and charges no delivery", async () => {
    const response = await createOrder(
      payload({ deliveryMethod: "pickup", packetaPoint: undefined, discountCode: "RODINA15" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.supabase.tables.orders![0]).toMatchObject({
      delivery_method: "pickup",
      delivery_price: 0,
      total_price: expectedTotal("basic", 1, "pickup", "RODINA15"),
    });
  });

  it("rejects Packeta delivery without a pickup point", async () => {
    await expectRejected(payload({ packetaPoint: undefined }), "packetaPoint");
  });

  it("rejects dedications on a non-Memory order", async () => {
    await expectRejected(payload({ dedications: ["Pre babku"] }), "dedications");
  });

  it("rejects a Memory order whose dedication count differs from the quantity", async () => {
    await expectRejected(payload({ type: "memory", quantity: 3, dedications: ["A", "B"] }), "dedications");
  });

  it("accepts a Memory order with one dedication per calendar", async () => {
    const response = await createOrder(payload({ type: "memory", quantity: 3, dedications: ["A", "", "C"] }));

    expect(response.status).toBe(200);
    expect(mocks.supabase.tables.orders![0]).toMatchObject({
      memory_set_enabled: true,
      dedications: ["A", "", "C"],
      total_price: expectedTotal("memory", 3, "packeta"),
    });
  });

  it("returns 429 when rate limited, before touching the database", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ ok: false, remaining: 0, retryAfterMs: 30_000 });

    const response = await createOrder(payload());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(mocks.supabase.tables.orders).toHaveLength(0);
  });

  it("deletes the pending order when the checkout session cannot be created", async () => {
    mocks.getOrCreateOrderCheckoutSession.mockResolvedValue({ status: "error", message: "stripe down" });

    const response = await createOrder(payload());

    expect(response.status).toBe(500);
    expect(mocks.supabase.tables.orders).toHaveLength(0);
    expect(mocks.sendOrderCreatedEmail).not.toHaveBeenCalled();
  });

  it("still succeeds when the awaiting-payment email fails", async () => {
    mocks.sendOrderCreatedEmail.mockRejectedValue(new Error("resend down"));

    const response = await createOrder(payload());

    expect(response.status).toBe(200);
    expect(mocks.supabase.tables.orders).toHaveLength(1);
  });
});
