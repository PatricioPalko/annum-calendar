export type DiscountCode = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  allowsPickup?: boolean;
};

export const discountCodes: DiscountCode[] = [
  {
    code: "ANNUM10",
    type: "percent",
    value: 10,
  },

  {
    code: "RODINA15",
    type: "percent",
    value: 15,
    allowsPickup: true,
  },
];

export function normalizeDiscountCode(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

export function getDiscountCode(code?: string | null) {
  const normalizedCode = normalizeDiscountCode(code);

  if (!normalizedCode) {
    return null;
  }

  return discountCodes.find((item) => item.code === normalizedCode) ?? null;
}

export function discountAllowsPickup(code?: string | null) {
  const discount = getDiscountCode(code);

  return Boolean(discount?.allowsPickup);
}

export function getDiscountAmount(
  totalPrice: number | null,
  code?: string | null,
) {
  if (totalPrice === null) {
    return {
      code: normalizeDiscountCode(code),
      isValid: false,
      discountAmount: 0,
      finalPrice: null,
    };
  }

  const normalizedCode = normalizeDiscountCode(code);

  if (!normalizedCode) {
    return {
      code: "",
      isValid: false,
      discountAmount: 0,
      finalPrice: totalPrice,
    };
  }

  const discount = getDiscountCode(normalizedCode);

  if (!discount) {
    return {
      code: normalizedCode,
      isValid: false,
      discountAmount: 0,
      finalPrice: totalPrice,
    };
  }

  const rawAmount =
    discount.type === "percent"
      ? totalPrice * (discount.value / 100)
      : discount.value;

  const discountAmount = Math.min(
    Math.round(rawAmount * 100) / 100,
    totalPrice,
  );

  return {
    code: normalizedCode,
    isValid: true,
    discountAmount,
    finalPrice: Math.max(totalPrice - discountAmount, 0),
  };
}
