export const calendarTypesValues = ["basic", "premium", "business"] as const;

export type CalendarTypes = (typeof calendarTypesValues)[number];

export type FixedPriceQuantity = 1 | 3 | 5;

export const CUSTOM_QUANTITY_VALUE = 0;

export const quantityOptions = [1, 3, 5, CUSTOM_QUANTITY_VALUE] as const;

export type QuantityOption = (typeof quantityOptions)[number];

export type CalendarTypesOption = {
  value: CalendarTypes;
  label: string;
  badge: string;
  description: string;
  prices: Partial<Record<FixedPriceQuantity, number>>;
  priceNote?: string;
};

export const calendarTypes = [
  {
    value: "basic",
    label: "Basic",
    badge: "Jednoduchý",
    description: "Kalendár s fotkami bez označených dátumov.",
    prices: {
      1: 25,
      3: 60,
      5: 75,
    },
  },
  {
    value: "premium",
    label: "Premium",
    badge: "Najobľúbenejší",
    description: "Kalendár s fotkami, meninami a narodeninami.",
    prices: {
      1: 32,
      3: 78,
      5: 110,
    },
  },
  {
    value: "business",
    label: "Business",
    badge: "10+ ks",
    description: "Pre firmy alebo väčšie objednávky od 10 kusov.",
    prices: {},
    priceNote: "Cena na mieru",
  },
] satisfies CalendarTypesOption[];

export const quantityItems = [
  { value: 1, label: "1 ks" },
  { value: 3, label: "3 ks" },
  { value: 5, label: "5 ks" },
  { value: CUSTOM_QUANTITY_VALUE, label: "Vlastný počet" },
] as const;

export function getCalendarType(type: CalendarTypes) {
  const calendarType = calendarTypes.find((item) => item.value === type);

  if (!calendarType) {
    throw new Error(`Unknown calendar type: ${type}`);
  }

  return calendarType;
}

export function isFixedPriceQuantity(
  quantity: number,
): quantity is FixedPriceQuantity {
  return quantity === 1 || quantity === 3 || quantity === 5;
}

export function resolveQuantity(values: {
  quantityOption: QuantityOption;
  customQuantity?: number;
}): number | null {
  if (values.quantityOption === CUSTOM_QUANTITY_VALUE) {
    return values.customQuantity ?? null;
  }

  return values.quantityOption;
}

export function getCalendarPrice(values: {
  type: CalendarTypes;
  quantityOption: QuantityOption;
  customQuantity?: number;
}): {
  quantity: number | null;
  totalPrice: number | null;
  pricePerPiece: number | null;
  originalPrice: number | null;
  savedAmount: number | null;
  priceNote: string | null;
} {
  const quantity = resolveQuantity({
    quantityOption: values.quantityOption,
    customQuantity: values.customQuantity,
  });

  const calendarType = getCalendarType(values.type);

  if (!quantity || values.type === "business") {
    return {
      quantity,
      totalPrice: null,
      pricePerPiece: null,
      originalPrice: null,
      savedAmount: null,
      priceNote: calendarType.priceNote ?? "Cena na mieru",
    };
  }

  const singlePiecePrice = calendarType.prices[1];

  if (!singlePiecePrice) {
    return {
      quantity,
      totalPrice: null,
      pricePerPiece: null,
      originalPrice: null,
      savedAmount: null,
      priceNote: calendarType.priceNote ?? "Cena na mieru",
    };
  }

  const unitPrice = (() => {
    if (quantity <= 2) {
      return singlePiecePrice;
    }

    if (quantity <= 4) {
      const threePackPrice = calendarType.prices[3];
      return threePackPrice ? threePackPrice / 3 : singlePiecePrice;
    }

    const fivePackPrice = calendarType.prices[5];
    return fivePackPrice ? fivePackPrice / 5 : singlePiecePrice;
  })();

  const totalPrice = unitPrice * quantity;
  const originalPrice = singlePiecePrice * quantity;
  const savedAmount = originalPrice - totalPrice;

  return {
    quantity,
    totalPrice,
    pricePerPiece: unitPrice,
    originalPrice,
    savedAmount: savedAmount > 0 ? savedAmount : null,
    priceNote: null,
  };
}

export function getLowestUnitPrice(plan: CalendarTypesOption): number | null {
  const fivePiecesPrice = plan.prices[5];

  if (!fivePiecesPrice) {
    return null;
  }

  return fivePiecesPrice / 5;
}
