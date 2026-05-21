export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createOrderCode(values: {
  firstName: string;
  lastName: string;
  year: number;
  orderNumber: number;
}) {
  const firstName = slugify(values.firstName);
  const lastName = slugify(values.lastName);
  const sequence = String(values.orderNumber).padStart(3, "0");

  return `${lastName}-${firstName}-${values.year}-${sequence}`;
}

export function createStorageFolder(values: {
  year: number;
  orderNumber: number;
}) {
  const sequence = String(values.orderNumber).padStart(3, "0");

  return `orders/${values.year}-${sequence}`;
}
