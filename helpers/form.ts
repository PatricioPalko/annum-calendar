import { CUSTOM_QUANTITY_VALUE } from "@/app/types/types";
import { OrderFormValues } from "@/lib/schema";

export function getFinalQuantity(values: OrderFormValues) {
  if (values.quantityOption === CUSTOM_QUANTITY_VALUE) {
    if (!values.customQuantity) {
      throw new Error("Custom quantity is required");
    }
    return values.customQuantity;
  }
  return values.quantityOption;
}
