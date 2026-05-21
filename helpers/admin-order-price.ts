import {
  CUSTOM_QUANTITY_VALUE,
  getCalendarPrice,
  type CalendarTypes,
  type QuantityOption,
} from "@/app/types/types";

function isFixedQuantity(quantity: number): quantity is 1 | 3 | 5 {
  return quantity === 1 || quantity === 3 || quantity === 5;
}

export function getAdminOrderPrice(values: {
  type: CalendarTypes;
  quantity: number;
}) {
  const quantityOption: QuantityOption = isFixedQuantity(values.quantity)
    ? values.quantity
    : CUSTOM_QUANTITY_VALUE;

  return getCalendarPrice({
    type: values.type,
    quantityOption,
    customQuantity: isFixedQuantity(values.quantity)
      ? undefined
      : values.quantity,
  });
}

export function formatPrice(value: number) {
  return Number.isInteger(value)
    ? `${value} €`
    : `${value.toFixed(2).replace(".", ",")} €`;
}
