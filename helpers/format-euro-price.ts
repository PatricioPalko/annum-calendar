const EURO_SUFFIX = "\u00A0€";

export function formatEuroAmount(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(".", ",");
}

export function formatEuroPrice(value: number): string {
  return `${formatEuroAmount(value)}${EURO_SUFFIX}`;
}
