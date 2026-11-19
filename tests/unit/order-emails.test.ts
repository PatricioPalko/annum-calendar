import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = await vi.hoisted(async () => {
  const { vi: hoistedVi } = await import("vitest");

  // lib/order-emails.ts reads EMAIL_FROM at import time.
  process.env.EMAIL_FROM = "Annum <objednavky@example.com>";
  process.env.ADMIN_EMAIL = "admin@example.com";

  return { send: hoistedVi.fn() };
});

vi.mock("@/lib/resend", () => ({
  getResend: () => ({ emails: { send: mocks.send } }),
}));

const { sendOrderReceivedEmails } = await import("@/lib/order-emails");

type SentEmail = { to: string | string[]; subject: string; html: string };

function baseParams() {
  return {
    orderCode: "testovaci-test-2026-b1-abcd",
    orderNumber: 7,
    firstName: "Test",
    lastName: "Testovací",
    email: "test@example.com",
    phone: "+421900123456",
    totalPrice: 23.9,
    goodsPrice: 23.9,
    calendarType: "basic" as const,
    quantity: 1,
  };
}

function sentEmails() {
  return mocks.send.mock.calls.map(([payload]) => payload as SentEmail);
}

function customerEmail() {
  return sentEmails().find((email) => email.to === "test@example.com")!;
}

function adminEmail() {
  return sentEmails().find((email) => email.to !== "test@example.com")!;
}

beforeEach(() => {
  mocks.send.mockReset().mockResolvedValue({ data: { id: "email-1" }, error: null });
  process.env.BANK_ACCOUNT_IBAN = "SK00 0000 0000 0000 0000 0000";
});

describe("order emails for offline payments", () => {
  it("sends bank transfer instructions with IBAN, variable symbol and payment note", async () => {
    const result = await sendOrderReceivedEmails({ ...baseParams(), paymentMethod: "bank_transfer" });

    expect(result).toMatchObject({ customerSent: true, adminSent: true });

    const { subject, html } = customerEmail();
    expect(subject).toBe("Objednávka testovaci-test-2026-b1-abcd bola prijatá");
    expect(html).toContain("Platba prevodom na účet");
    expect(html).toContain("SK00 0000 0000 0000 0000 0000");
    expect(html).toContain("Variabilný symbol");
    expect(html).toContain("Správa pre prijímateľa");
    expect(html).toContain("23,90 €");
    expect(html).not.toContain("Platba bola prijatá");
  });

  it("tells the customer the account number follows when BANK_ACCOUNT_IBAN is missing", async () => {
    delete process.env.BANK_ACCOUNT_IBAN;

    await sendOrderReceivedEmails({ ...baseParams(), paymentMethod: "bank_transfer" });

    expect(customerEmail().html).toContain("Číslo účtu Vám pošleme v samostatnom e-maile.");
  });

  it("asks for cash at pickup without bank details", async () => {
    await sendOrderReceivedEmails({ ...baseParams(), paymentMethod: "cash" });

    const { html } = customerEmail();
    expect(html).toContain("v hotovosti pri osobnom odbere");
    expect(html).not.toContain("IBAN");
  });

  it("notifies the admin about a new order with the chosen payment method", async () => {
    await sendOrderReceivedEmails({ ...baseParams(), paymentMethod: "cash" });

    const { subject, html } = adminEmail();
    expect(subject).toBe("Nová objednávka testovaci-test-2026-b1-abcd");
    expect(html).toContain("v hotovosti pri odbere");
    expect(html).toContain("web ju neoveruje");
  });

  it("escapes customer-controlled values", async () => {
    await sendOrderReceivedEmails({
      ...baseParams(),
      firstName: "<script>alert(1)</script>",
      note: "<img src=x onerror=alert(1)>",
      paymentMethod: "bank_transfer",
    });

    for (const { html } of sentEmails()) {
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<img src=x");
    }
  });

  it("shows personal pickup and the payment method in the order summary", async () => {
    await sendOrderReceivedEmails({ ...baseParams(), paymentMethod: "bank_transfer" });

    const { html } = customerEmail();
    expect(html).toContain("Osobný odber v Košiciach");
    expect(html).toContain("Spôsob platby");
    expect(html).toContain("Prevodom na účet");
  });
});
