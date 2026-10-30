import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = await vi.hoisted(async () => {
  const { vi: hoistedVi } = await import("vitest");
  const { createFakeSupabase } = await import("./helpers/fake-supabase");

  return {
    supabase: createFakeSupabase(),
    currentUserEmail: "admin@example.com" as string | null,
    createPacketaPacket: hoistedVi.fn(),
    sendOrderFulfillmentEmail: hoistedVi.fn(),
    sendOrderPaidEmail: hoistedVi.fn(),
    sendAdminAlertEmail: hoistedVi.fn(),
    sessionsRetrieve: hoistedVi.fn(),
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

vi.mock("@/lib/packeta", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/packeta")>()),
  createPacketaPacket: mocks.createPacketaPacket,
  isPacketaConfigured: () => true,
}));

vi.mock("@/lib/order-emails", () => ({
  sendOrderFulfillmentEmail: mocks.sendOrderFulfillmentEmail,
  sendOrderPaidEmail: mocks.sendOrderPaidEmail,
  sendAdminAlertEmail: mocks.sendAdminAlertEmail,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: { checkout: { sessions: { retrieve: mocks.sessionsRetrieve } } },
}));

const completeRoute = await import("@/app/api/admin/orders/[orderId]/complete/route");
const packetaRoute = await import("@/app/api/admin/orders/[orderId]/create-packeta-packet/route");
const downloadRoute = await import("@/app/api/admin/orders/[orderId]/download/route");
const notifyRoute = await import("@/app/api/admin/orders/[orderId]/notify-fulfillment/route");
const resendRoute = await import("@/app/api/admin/orders/[orderId]/resend-paid-emails/route");
const deleteRoute = await import("@/app/api/admin/orders/[orderId]/route");
const bulkDownloadRoute = await import("@/app/api/admin/orders/download-undownloaded/route");
const sessionRoute = await import("@/app/api/admin/session/route");

type Handler = (request: Request, context: { params: Promise<{ orderId: string }> }) => Promise<Response>;

const ORDER_URL = "https://www.annum.sk/api/admin/orders/order-1";

/** Every order-scoped admin route, with the status it returns for an unpaid order. */
const orderRoutes: Array<{ name: string; method: string; handler: Handler; unpaidStatus: number | null }> = [
  { name: "complete", method: "POST", handler: completeRoute.POST, unpaidStatus: 403 },
  { name: "create-packeta-packet", method: "POST", handler: packetaRoute.POST, unpaidStatus: 400 },
  { name: "download", method: "GET", handler: downloadRoute.GET, unpaidStatus: 403 },
  { name: "notify-fulfillment", method: "POST", handler: notifyRoute.POST, unpaidStatus: 403 },
  { name: "resend-paid-emails", method: "POST", handler: resendRoute.POST, unpaidStatus: 403 },
  // Delete is meant for unpaid orders; its paid guard is in admin-delete-order.test.ts.
  { name: "delete", method: "DELETE", handler: deleteRoute.DELETE, unpaidStatus: null },
];

function callOrderRoute(route: (typeof orderRoutes)[number], origin: string | null = "https://www.annum.sk") {
  return route.handler(
    new Request(`${ORDER_URL}/${route.name}`, {
      method: route.method,
      headers: origin ? { origin } : {},
    }),
    { params: Promise.resolve({ orderId: "order-1" }) },
  );
}

function callBulkDownload(origin = "https://www.annum.sk") {
  return bulkDownloadRoute.GET(
    new Request("https://www.annum.sk/api/admin/orders/download-undownloaded", {
      headers: { origin },
    }),
  );
}

function expectNoSideEffects() {
  expect(mocks.createPacketaPacket).not.toHaveBeenCalled();
  expect(mocks.sendOrderFulfillmentEmail).not.toHaveBeenCalled();
  expect(mocks.sendOrderPaidEmail).not.toHaveBeenCalled();
  expect(mocks.sessionsRetrieve).not.toHaveBeenCalled();
  expect(mocks.supabase.tables.orders).toHaveLength(1);
  expect(mocks.supabase.tables.orders![0]).toMatchObject({ status: "new", downloaded_at: null });
}

beforeEach(() => {
  process.env.ADMIN_EMAILS = "admin@example.com";
  process.env.NEXT_PUBLIC_APP_URL = "https://www.annum.sk";
  mocks.currentUserEmail = "admin@example.com";
  mocks.supabase.reset();
  mocks.supabase.tables.orders!.push({
    id: "order-1",
    order_code: "testovaci-test-2026-b1-abcd",
    order_number: 7,
    first_name: "Test",
    last_name: "Testovací",
    email: "test@example.com",
    payment_status: "pending",
    status: "new",
    delivery_method: "packeta",
    packeta_point_id: "123",
    tracking_number: null,
    downloaded_at: null,
    photos: [],
    stripe_checkout_session_id: null,
  });

  for (const mock of [
    mocks.createPacketaPacket,
    mocks.sendOrderFulfillmentEmail,
    mocks.sendOrderPaidEmail,
    mocks.sendAdminAlertEmail,
    mocks.sessionsRetrieve,
  ]) {
    mock.mockReset();
  }
});

async function expectRejected(response: Response, status: 401 | 403) {
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({
    message: status === 403 ? "Forbidden" : "Unauthorized",
  });
}

describe.each(orderRoutes)("admin route $name authorization (H-6)", (route) => {
  // A paid order, so the auth check is the only thing that can reject.
  beforeEach(() => {
    mocks.supabase.tables.orders![0]!.payment_status = "paid";
  });

  it("rejects a cross-site request with 403", async () => {
    await expectRejected(await callOrderRoute(route, "https://evil.example"), 403);
    expectNoSideEffects();
  });

  it("rejects a request without Origin or Referer with 403", async () => {
    await expectRejected(await callOrderRoute(route, null), 403);
    expectNoSideEffects();
  });

  it("rejects a request without a session with 401", async () => {
    mocks.currentUserEmail = null;

    await expectRejected(await callOrderRoute(route), 401);
    expectNoSideEffects();
  });

  it("rejects a signed-in user who is not on the allowlist with 401", async () => {
    mocks.currentUserEmail = "someone@example.com";

    await expectRejected(await callOrderRoute(route), 401);
    expectNoSideEffects();
  });
});

describe.each(orderRoutes.filter((route) => route.unpaidStatus !== null))(
  "admin route $name paid gate (H-6)",
  (route) => {
    it(`refuses an unpaid order with ${route.unpaidStatus}`, async () => {
      expect((await callOrderRoute(route)).status).toBe(route.unpaidStatus);
      expectNoSideEffects();
    });
  },
);

describe("admin bulk download authorization (H-6)", () => {
  it("rejects a cross-site request with 403", async () => {
    await expectRejected(await callBulkDownload("https://evil.example"), 403);
  });

  it("rejects non-admins with 401", async () => {
    mocks.currentUserEmail = null;
    await expectRejected(await callBulkDownload(), 401);

    mocks.currentUserEmail = "someone@example.com";
    await expectRejected(await callBulkDownload(), 401);
  });

  it("never exports unpaid orders", async () => {
    expect((await callBulkDownload()).status).toBe(404);
    expect(mocks.supabase.tables.orders![0]!.downloaded_at).toBeNull();
  });
});

describe("admin session check (H-6)", () => {
  it("returns 401 without a session or for a non-allowlisted user", async () => {
    mocks.currentUserEmail = null;
    expect((await sessionRoute.GET()).status).toBe(401);

    mocks.currentUserEmail = "someone@example.com";
    expect((await sessionRoute.GET()).status).toBe(401);
  });

  it("returns 200 for an allowlisted admin", async () => {
    expect((await sessionRoute.GET()).status).toBe(200);
  });
});
