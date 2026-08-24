import { randomInt } from "node:crypto";

const calendarTypeCodes = {
  basic: "b",
  premium: "p",
  memory: "m",
  business: "u",
} as const;

type CalendarType = keyof typeof calendarTypeCodes;

function normalizeOrderCodePart(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function createRandomOrderSuffix(length = 4) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";

  return Array.from({ length }, () => {
    return alphabet[randomInt(alphabet.length)];
  }).join("");
}

export function createOrderCode({
  firstName,
  lastName,
  year,
  type,
  quantity,
}: {
  firstName: string;
  lastName: string;
  year: number;
  type: CalendarType;
  quantity: number;
}) {
  const safeFirstName = normalizeOrderCodePart(firstName);
  const safeLastName = normalizeOrderCodePart(lastName);

  const typeCode = calendarTypeCodes[type];
  const variantCode = `${typeCode}${quantity}`;
  const suffix = createRandomOrderSuffix();

  return `${safeLastName}-${safeFirstName}-${year}-${variantCode}-${suffix}`;
}

export function createStorageFolder({
  year,
  orderNumber,
}: {
  year: number;
  orderNumber: number;
}) {
  return `orders/${year}-${String(orderNumber).padStart(3, "0")}`;
}

export function parseStorageFolder(storageFolder: string): {
  year: number;
  orderNumber: number;
} | null {
  const match = /^orders\/(\d{4})-(\d+)$/.exec(storageFolder);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    orderNumber: Number(match[2]),
  };
}

export function isStorageFolderForOrderNumber(
  storageFolder: string,
  orderNumber: number,
) {
  const parsed = parseStorageFolder(storageFolder);

  return parsed !== null && parsed.orderNumber === orderNumber;
}
