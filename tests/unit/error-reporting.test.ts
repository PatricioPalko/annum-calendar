import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = await vi.hoisted(async () => {
  const { vi: hoistedVi } = await import("vitest");

  return { sendAdminAlertEmail: hoistedVi.fn() };
});

vi.mock("@/lib/order-emails", () => ({
  sendAdminAlertEmail: mocks.sendAdminAlertEmail,
}));

const { reportRequestError, resetErrorReportingThrottle } = await import("@/lib/error-reporting");

const request = { path: "/objednavka/dakujeme?session_id=cs_test_secret", method: "GET", headers: {} };
const context = { routePath: "/objednavka/dakujeme", routeType: "render" };

function report(error: unknown = new Error("boom")) {
  return reportRequestError(error, request, context);
}

function sentParams() {
  return mocks.sendAdminAlertEmail.mock.calls.map((call) => call[0]);
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.annum.sk");
  resetErrorReportingThrottle();
  mocks.sendAdminAlertEmail.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("reportRequestError (H-4)", () => {
  it("emails the route pattern and error, never the request URL", async () => {
    const error = Object.assign(new Error("Database timeout"), { digest: "123456" });

    await report(error);

    expect(mocks.sendAdminAlertEmail).toHaveBeenCalledOnce();
    const params = sentParams()[0];
    expect(params).toMatchObject({
      code: "SERVER_ERROR",
      details: [
        ["Route", "GET /objednavka/dakujeme"],
        ["Typ", "render"],
        ["Chyba", "Error: Database timeout"],
        ["Digest", "123456"],
      ],
    });
    expect(JSON.stringify(params)).not.toContain("cs_test_secret");
  });

  it("uses the same dedupe id for the same error on the same route", async () => {
    await report(new Error("boom"));
    await report(new Error("boom"));
    await report(new Error("other"));

    const [first, second, third] = sentParams();
    expect(first.dedupeId).toBe(second.dedupeId);
    expect(first.dedupeId).not.toBe(third.dedupeId);
  });

  it("truncates long messages", async () => {
    await report(new Error("x".repeat(1000)));

    const chyba = sentParams()[0].details.find(([label]: [string]) => label === "Chyba")[1] as string;
    expect(chyba.length).toBeLessThanOrEqual("Error: ".length + 300);
  });

  it.each([
    ["development", { NODE_ENV: "development" }],
    ["a Vercel preview", { VERCEL_ENV: "preview" }],
    ["another origin", { NEXT_PUBLIC_APP_URL: "https://annum-calendar.vercel.app" }],
    ["the apex domain", { NEXT_PUBLIC_APP_URL: "https://annum.sk" }],
  ])("does nothing on %s", async (_label, env) => {
    for (const [name, value] of Object.entries(env)) {
      vi.stubEnv(name, value);
    }

    await report();

    expect(mocks.sendAdminAlertEmail).not.toHaveBeenCalled();
  });

  it("sends at most 5 alerts per 10 minutes per instance", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-30T12:00:00Z") });

    try {
      for (let index = 0; index < 8; index += 1) {
        await report(new Error(`error ${index}`));
      }

      expect(mocks.sendAdminAlertEmail).toHaveBeenCalledTimes(5);

      vi.setSystemTime(new Date("2026-10-30T12:10:01Z"));
      await report(new Error("later"));

      expect(mocks.sendAdminAlertEmail).toHaveBeenCalledTimes(6);
    } finally {
      vi.useRealTimers();
    }
  });

  it("never throws when the alert email fails", async () => {
    mocks.sendAdminAlertEmail.mockRejectedValue(new Error("resend down"));

    await expect(report()).resolves.toBeUndefined();
  });

  it("handles non-Error throws", async () => {
    await report("plain string");

    expect(sentParams()[0].details).toContainEqual(["Chyba", "string: plain string"]);
  });
});
