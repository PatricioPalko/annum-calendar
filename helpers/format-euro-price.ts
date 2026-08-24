const EURO_SUFFIX = "\u00A0€";

export const VAT_PRICE_LABEL = "s DPH";

export function formatEuroAmount(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(".", ",");
}

export function formatEuroPrice(value: number): string {
  return `${formatEuroAmount(value)}${EURO_SUFFIX}`;
}

export function formatEuroPriceWithVat(value: number): string {
  return `${formatEuroPrice(value)} ${VAT_PRICE_LABEL}`;
}

export function formatEuroUnitPriceWithVat(value: number): string {
  return `${formatEuroPrice(value)}/ks ${VAT_PRICE_LABEL}`;
}
