import { describe, expect, it } from "vitest";

import {
  CUSTOM_QUANTITY_VALUE,
  getCalendarPrice,
  getQuantityOptionFromQuantity,
  orderableCalendarTypesValues,
} from "@/app/types/types";
import { getDeliveryPrice } from "@/helpers/delivery";
import {
  discountAllowsPickup,
  getDiscountAmount,
} from "@/helpers/discount-codes";

/** Same call shape as app/api/orders/route.ts uses for the server-side price. */
function priceFor(type: (typeof orderableCalendarTypesValues)[number], quantity: number) {
  const quantityOption = getQuantityOptionFromQuantity(quantity);

  return getCalendarPrice({
    type,
    quantityOption,
    customQuantity:
      quantityOption === CUSTOM_QUANTITY_VALUE ? quantity : undefined,
  }).totalPrice;
}

/**
 * Cents Postgres stores for a JS number sent through PostgREST into a
 * numeric(10,2) column: exact decimal of the serialized number, rounded half
 * away from zero.
 */
function postgresNumeric2Cents(value: number) {
  const [integerPart, fraction = ""] = String(value).split(".");
  const digits = `${fraction}000`;
  // Order totals stay far below Number.MAX_SAFE_INTEGER cents.
  let cents = Number(`${integerPart}${digits.slice(0, 2)}`);

  if (Number(digits[2]) >= 5 && digits.slice(2).replace(/0+$/, "") !== "") {
    cents += 1;
  }

  return cents;
}

describe("getCalendarPrice", () => {
  // Expected totals derived by hand from the price table in app/types/types.ts:
  // 1–2 pcs at the single price, 3–4 at the 3-pack unit price, 5+ at the 5-pack unit price.
  it.each([
    ["basic", 1, 23.9],
    ["basic", 2, 47.8],
    ["basic", 3, 65.7],
    ["basic", 4, 87.6],
    ["basic", 5, 99.5],
    ["basic", 6, 119.4],
    ["basic", 10, 199],
    ["basic", 200, 3980],
    ["premium", 1, 29.9],
    ["premium", 2, 59.8],
    ["premium", 3, 83.7],
    ["premium", 4, 111.6],
    ["premium", 5, 129.5],
    ["premium", 6, 155.4],
    ["premium", 10, 259],
    ["premium", 200, 5180],
    ["memory", 1, 49],
    ["memory", 2, 98],
    ["memory", 3, 135],
    ["memory", 4, 180],
    ["memory", 5, 195],
    ["memory", 6, 234],
    ["memory", 10, 390],
    ["memory", 200, 7800],
  ] as const)("%s × %i costs %d €", (type, quantity, expected) => {
    expect(priceFor(type, quantity)).toBeCloseTo(expected, 2);
  });

  it("returns no price when the custom quantity is missing", () => {
    expect(
      getCalendarPrice({ type: "premium", quantityOption: CUSTOM_QUANTITY_VALUE })
        .totalPrice,
    ).toBeNull();
  });
});

describe("discounts and delivery", () => {
  it("applies ANNUM10 as 10 % of the goods price", () => {
    expect(getDiscountAmount(83.7, "ANNUM10")).toMatchObject({
      isValid: true,
      discountAmount: 8.37,
      finalPrice: 75.33,
    });
  });

  it("applies RODINA15 as 15 % and normalizes case and whitespace", () => {
    const discount = getDiscountAmount(49, "  rodina15 ");

    expect(discount.isValid).toBe(true);
    expect(discount.code).toBe("RODINA15");
    expect(discount.discountAmount).toBeCloseTo(7.35, 2);
    expect(discount.finalPrice).toBeCloseTo(41.65, 2);
  });

  it("ignores unknown codes without changing the price", () => {
    expect(getDiscountAmount(100, "NOPE")).toMatchObject({
      isValid: false,
      discountAmount: 0,
      finalPrice: 100,
    });
  });

  it("allows personal pickup only with a code that permits it", () => {
    expect(discountAllowsPickup("RODINA15")).toBe(true);
    expect(discountAllowsPickup("rodina15")).toBe(true);
    expect(discountAllowsPickup("ANNUM10")).toBe(false);
    expect(discountAllowsPickup(undefined)).toBe(false);
  });

  it("charges 3.90 € for Packeta and nothing for pickup", () => {
    expect(getDeliveryPrice("packeta")).toBe(3.9);
    expect(getDeliveryPrice("pickup")).toBe(0);
  });
});

describe("price consistency between checkout, database and webhook", () => {
  it("produces identical cents on every path for all orderable combinations", () => {
    const mismatches: string[] = [];
    let combinations = 0;

    for (const type of orderableCalendarTypesValues) {
      for (let quantity = 1; quantity <= 200; quantity++) {
        for (const code of [undefined, "ANNUM10", "RODINA15"]) {
          for (const delivery of ["packeta", "pickup"] as const) {
            combinations++;

            const goods = priceFor(type, quantity);
            const discount = getDiscountAmount(goods, code);
            // Same expression as app/api/orders/route.ts (finalTotalPrice).
            const total = discount.finalPrice! + getDeliveryPrice(delivery);

            // lib/order-checkout.ts: unit_amount for Stripe Checkout.
            const stripeCents = Math.round(total * 100);
            // Value stored in orders.total_price (numeric(10,2)).
            const storedCents = postgresNumeric2Cents(total);
            // lib/order-payments.ts: expectedAmountCents from the stored value.
            const webhookCents = Math.round((storedCents / 100) * 100);

            if (total <= 0 || stripeCents !== webhookCents) {
              mismatches.push(`${type} × ${quantity} ${code ?? "-"} ${delivery}: ${total}`);
            }
          }
        }
      }
    }

    expect(combinations).toBe(3600);
    expect(mismatches).toEqual([]);
  });
});
