export const calendarTypesValues = ["basic", "premium", "business"] as const;

export type CalendarTypes = (typeof calendarTypesValues)[number];

export type FixedPriceQuantity = 1 | 3 | 5;

export const calendarTypes = [
  {
    value: "basic",
    label: "Basic",
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
    description: "Kalendár s fotkami, meninami, narodeninami a výročiami.",
    prices: {
      1: 32,
      3: 78,
      5: 110,
    },
  },
  {
    value: "business",
    label: "Business",
    description: "Pre firmy alebo väčšie objednávky od 10 kusov.",
    prices: {},
    priceNote: "Cena na mieru",
  },
] satisfies CalendarTypesOption[];

export type CalendarTypesOption = {
  value: CalendarTypes;
  label: string;
  description: string;
  prices: Partial<Record<FixedPriceQuantity, number>>;
  priceNote?: string;
};

export const quantityOptions = [1, 3, 5, 0] as const;

export type QuantityOption = (typeof quantityOptions)[number];

export const CUSTOM_QUANTITY_VALUE = 0;

export const quantityItems = [
  { value: 1, label: "1 kus" },
  { value: 3, label: "3 kusy" },
  { value: 5, label: "5 kusov" },
  { value: CUSTOM_QUANTITY_VALUE, label: "Vlastný počet" },
] as const;
