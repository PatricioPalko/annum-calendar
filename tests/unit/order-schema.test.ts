import { describe, expect, it } from "vitest";

import { orderSchema } from "@/lib/schema";

const photo = new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" });

const formValues = {
  firstName: "Test",
  lastName: "Testovací",
  email: "test@example.com",
  phone: "+421900123456",
  types: "basic",
  quantityOption: 1,
  photos: Array.from({ length: 14 }, () => photo),
  birthdays: [],
  namedays: [],
  termsAccepted: true,
  dedications: [],
};

describe("order form schema", () => {
  it.each([
    ["omitted", {}],
    ["undefined", { paymentMethod: undefined }],
    ["empty", { paymentMethod: "" }],
    ["unknown", { paymentMethod: "card" }],
  ])("requires a payment method (%s)", (_label, extra) => {
    const result = orderSchema.safeParse({ ...formValues, ...extra });

    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(
      expect.objectContaining({ path: ["paymentMethod"], message: "Vyberte spôsob platby." }),
    );
  });

  it.each(["bank_transfer", "cash"])("accepts %s", (paymentMethod) => {
    expect(orderSchema.safeParse({ ...formValues, paymentMethod }).success).toBe(true);
  });
});
