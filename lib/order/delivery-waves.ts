import { formatDate } from "@/helpers/format-date-time";

const TIMEZONE = "Europe/Bratislava";

export type DeliveryWaveKey =
  | "batch-2026-october"
  | "batch-2026-november"
  | "batch-2026-december"
  | "batch-2027-january"
  | "standard";

export type DeliveryWave = {
  key: DeliveryWaveKey;
  /** Krátky názov pre zákazníka */
  label: string;
  /** Názov várky pre admin / tlačiareň */
  batchLabel: string;
  /** Posledný deň prijatia objednávky (vrátane), ISO YYYY-MM-DD */
  orderDeadline: string;
  /** Odhad doručenia do (ISO YYYY-MM-DD), prázdne = individuálne */
  estimatedDeliveryBy: string;
  customerHeadline: string;
  customerDetail: string;
};

/**
 * Várky hromadnej výroby. Upravte dátumy podľa skutočných termínov tlače.
 */
export const DELIVERY_WAVES: DeliveryWave[] = [
  {
    key: "batch-2026-october",
    label: "Jeseň 2026",
    batchLabel: "Varka A — jeseň 2026",
    orderDeadline: "2026-10-31",
    estimatedDeliveryBy: "2026-11-22",
    customerHeadline: "Jesenná várka",
    customerDetail:
      "Objednávky prijaté a zaplatené do 31. 10. 2026 doručíme do 22. 11. 2026.",
  },
  {
    key: "batch-2026-november",
    label: "November 2026",
    batchLabel: "Varka B — november 2026",
    orderDeadline: "2026-11-30",
    estimatedDeliveryBy: "2026-12-18",
    customerHeadline: "Novemberová várka",
    customerDetail:
      "Objednávky prijaté a zaplatené do 30. 11. 2026 doručíme do 18. 12. 2026.",
  },
  {
    key: "batch-2026-december",
    label: "Vianoce 2026",
    batchLabel: "Varka C — vianoce 2026",
    orderDeadline: "2026-12-13",
    estimatedDeliveryBy: "2026-12-22",
    customerHeadline: "Vianočná várka",
    customerDetail:
      "Objednávky prijaté a zaplatené do 13. 12. 2026 doručíme do 22. 12. 2026 — vhodné na darček pod stromček.",
  },
  {
    key: "batch-2027-january",
    label: "Január 2027",
    batchLabel: "Varka D — január 2027",
    orderDeadline: "2027-01-10",
    estimatedDeliveryBy: "2027-01-28",
    customerHeadline: "Januárová várka",
    customerDetail:
      "Objednávky prijaté a zaplatené do 10. 1. 2027 doručíme do 28. 1. 2027.",
  },
];

export const STANDARD_DELIVERY_WAVE: DeliveryWave = {
  key: "standard",
  label: "Bežná výroba",
  batchLabel: "Bežná várka",
  orderDeadline: "9999-12-31",
  estimatedDeliveryBy: "",
  customerHeadline: "Bežná výroba",
  customerDetail:
    "Odhadované doručenie približne do 4 týždňov od zaplatenia objednávky. Presný termín potvrdíme e-mailom.",
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function parseDateOnly(iso: string): DateParts {
  const [year, month, day] = iso.split("-").map(Number);

  return { year, month, day };
}

function getDateOnlyParts(date: Date): DateParts {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  return parseDateOnly(formatted);
}

function compareDateParts(a: DateParts, b: DateParts): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }

  if (a.month !== b.month) {
    return a.month - b.month;
  }

  return a.day - b.day;
}

function compareDateToIso(date: DateParts, iso: string): number {
  return compareDateParts(date, parseDateOnly(iso));
}

const SORTED_BATCH_WAVES = [...DELIVERY_WAVES].sort((left, right) =>
  compareDateParts(
    parseDateOnly(left.orderDeadline),
    parseDateOnly(right.orderDeadline),
  ),
);

export function getDeliveryWaveForDate(date: Date = new Date()): DeliveryWave {
  const today = getDateOnlyParts(date);

  for (const wave of SORTED_BATCH_WAVES) {
    if (compareDateToIso(today, wave.orderDeadline) <= 0) {
      return wave;
    }
  }

  return STANDARD_DELIVERY_WAVE;
}

export function getUpcomingDeliveryWaves(
  date: Date = new Date(),
): DeliveryWave[] {
  const today = getDateOnlyParts(date);

  return SORTED_BATCH_WAVES.filter(
    (wave) => compareDateToIso(today, wave.orderDeadline) <= 0,
  );
}

export function getDeliveryWaveByKey(key: string | null | undefined): DeliveryWave | null {
  if (!key) {
    return null;
  }

  if (key === STANDARD_DELIVERY_WAVE.key) {
    return STANDARD_DELIVERY_WAVE;
  }

  return DELIVERY_WAVES.find((wave) => wave.key === key) ?? null;
}

export function getAllDeliveryWaveFilterOptions(): DeliveryWave[] {
  return [...SORTED_BATCH_WAVES, STANDARD_DELIVERY_WAVE];
}

export function formatWaveDeadline(wave: DeliveryWave): string {
  if (wave.key === "standard") {
    return "—";
  }

  return formatDate(`${wave.orderDeadline}T12:00:00.000Z`);
}

export function formatWaveDeliveryBy(wave: DeliveryWave): string {
  if (!wave.estimatedDeliveryBy) {
    return "cca 4 týždne od zaplatenia";
  }

  return formatDate(`${wave.estimatedDeliveryBy}T12:00:00.000Z`);
}

export function isCurrentDeliveryWave(
  wave: DeliveryWave,
  date: Date = new Date(),
): boolean {
  return getDeliveryWaveForDate(date).key === wave.key;
}
