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
      3: 66,
      5: 95,
    },
  },
  {
    value: "premium",
    label: "Premium",
    badge: "Obľubený",
    description: "Kalendár s fotkami, meninami a narodeninami.",
    prices: {
      1: 32,
      3: 84,
      5: 125,
    },
  },
  {
    value: "business",
    label: "Business Basic",
    badge: "Pre firmy",
    description: "Kalendáre pre firmy, tímy alebo väčšie darčekové objednávky.",
    prices: {},
    priceNote: "Cena podľa množstva",
  },
] satisfies CalendarTypesOption[];

export const BUSINESS_MIN_QUANTITY = 10;

export const businessVolumeTiers = [
  { minQuantity: 10, unitPrice: 20 },
] as const;

export function getBusinessUnitPrice(quantity: number): number | null {
  if (quantity < BUSINESS_MIN_QUANTITY) {
    return null;
  }

  for (const tier of businessVolumeTiers) {
    if (quantity >= tier.minQuantity) {
      return tier.unitPrice;
    }
  }

  return businessVolumeTiers[businessVolumeTiers.length - 1]?.unitPrice ?? null;
}

export function getBusinessEntryUnitPrice() {
  return businessVolumeTiers[businessVolumeTiers.length - 1]!.unitPrice;
}

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

export function formatUnitPrice(price: number) {
  return Number.isInteger(price)
    ? String(price)
    : price.toFixed(2).replace(".", ",");
}

export function getLowestUnitPrice(plan: CalendarTypesOption): number | null {
  if (plan.value === "business") {
    return businessVolumeTiers[0]?.unitPrice ?? null;
  }

  const fivePiecesPrice = plan.prices[5];

  if (!fivePiecesPrice) {
    return null;
  }

  return fivePiecesPrice / 5;
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

  if (!quantity) {
    return {
      quantity,
      totalPrice: null,
      pricePerPiece: null,
      originalPrice: null,
      savedAmount: null,
      priceNote: calendarType.priceNote ?? "Cena na mieru",
    };
  }

  if (values.type === "business") {
    if (quantity < BUSINESS_MIN_QUANTITY) {
      return {
        quantity,
        totalPrice: null,
        pricePerPiece: null,
        originalPrice: null,
        savedAmount: null,
        priceNote: `Minimálne ${BUSINESS_MIN_QUANTITY} kusov`,
      };
    }

    const unitPrice = getBusinessUnitPrice(quantity);

    if (unitPrice === null) {
      return {
        quantity,
        totalPrice: null,
        pricePerPiece: null,
        originalPrice: null,
        savedAmount: null,
        priceNote: calendarType.priceNote ?? "Cena na mieru",
      };
    }

    const entryUnitPrice = getBusinessEntryUnitPrice();
    const totalPrice = unitPrice * quantity;
    const originalPrice = entryUnitPrice * quantity;
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

export type SortKey =
  | "created_at"
  | "order_code"
  | "customer"
  | "calendar_type"
  | "quantity"
  | "photos"
  | "downloaded";

export type SearchParams = Promise<{
  sort?: SortKey;
  dir?: "asc" | "desc";
  year?: string;
  month?: string;
  calendar?: string;
  delivery?: string;
}>;

export type OrderRow = {
  id: string;
  created_at: string;
  order_code: string | null;
  storage_folder: string | null;

  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  note: string | null;

  calendar_type: CalendarTypes;
  quantity: number;

  photos: Array<{
    name: string;
    type: string;
    size: number;
    path: string;
  }>;

  birthdays: unknown[];
  namedays: unknown[];

  total_price: number | null;

  status: string;
  downloaded_at: string | null;
  ready_at: string | null;
  shipped_at: string | null;

  discount_code: string | null;
  discount_amount: number | string | null;

  payment_status: string | null;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  delivery_method: "pickup" | "packeta" | string | null;
  delivery_price: number | string | null;

  packeta_point_id: string | null;
  packeta_point_name: string | null;
  packeta_point_address: string | null;

  tracking_number: string | null;

  marketing_consent_at: string | null;
  terms_accepted_at: string | null;
};

export function getQuantityOptionFromQuantity(
  quantity: number,
): QuantityOption {
  if (quantity === 1 || quantity === 3 || quantity === 5) {
    return quantity;
  }

  return CUSTOM_QUANTITY_VALUE;
}
