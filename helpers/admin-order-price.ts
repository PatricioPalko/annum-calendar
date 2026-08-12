import {
  CUSTOM_QUANTITY_VALUE,
  getCalendarPrice,
  type CalendarTypes,
  type QuantityOption,
} from "@/app/types/types";

import { formatEuroPrice } from "@/helpers/format-euro-price";

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

export { formatEuroPrice as formatPrice };
