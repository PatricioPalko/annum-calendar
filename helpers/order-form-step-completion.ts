import { CUSTOM_QUANTITY_VALUE } from "@/app/types/types";
import { MIN_PHOTOS } from "@/lib/order/config";
import type { OrderFormValues } from "@/lib/schema";
import type { FieldErrors } from "react-hook-form";

export type OrderFormStepId =
  | "type"
  | "quantity"
  | "photos"
  | "dedication"
  | "birthdays"
  | "namedays"
  | "delivery"
  | "contact"
  | "note";

export function getOrderFormStepCount(type: OrderFormValues["types"]) {
  if (type === "basic") {
    return 6;
  }

  if (type === "memory") {
    return 9;
  }

  return 8;
}

export function isOrderTypeStepComplete(values: Pick<OrderFormValues, "types">) {
  return (
    values.types === "basic" ||
    values.types === "premium" ||
    values.types === "memory"
  );
}

export function isOrderQuantityStepComplete(
  values: Pick<OrderFormValues, "quantityOption" | "customQuantity">,
) {
  if (values.quantityOption === CUSTOM_QUANTITY_VALUE) {
    return (
      values.customQuantity !== undefined &&
      values.customQuantity >= 1 &&
      values.customQuantity <= 200
    );
  }

  return (
    values.quantityOption === 1 ||
    values.quantityOption === 3 ||
    values.quantityOption === 5
  );
}

export function isOrderPhotosStepComplete(
  values: Pick<OrderFormValues, "photos">,
) {
  return (values.photos?.length ?? 0) >= MIN_PHOTOS;
}

export function isOrderDedicationStepComplete(
  errors: FieldErrors<OrderFormValues>,
) {
  return !errors.dedications;
}

export function isOrderBirthdaysStepComplete(
  values: Pick<OrderFormValues, "birthdays">,
  errors: FieldErrors<OrderFormValues>,
  deliveryComplete: boolean,
  contactComplete: boolean,
) {
  if (errors.birthdays) {
    return false;
  }

  return (
    (values.birthdays?.length ?? 0) > 0 || deliveryComplete || contactComplete
  );
}

export function isOrderNamedaysStepComplete(
  values: Pick<OrderFormValues, "namedays">,
  errors: FieldErrors<OrderFormValues>,
  deliveryComplete: boolean,
  contactComplete: boolean,
) {
  if (errors.birthdays) {
    return false;
  }

  return (
    (values.namedays?.length ?? 0) > 0 || deliveryComplete || contactComplete
  );
}

export function isOrderDeliveryStepComplete(
  values: Pick<OrderFormValues, "deliveryMethod" | "packetaPoint">,
  errors: FieldErrors<OrderFormValues>,
) {
  if (errors.deliveryMethod || errors.packetaPoint) {
    return false;
  }

  if (values.deliveryMethod === "packeta") {
    return Boolean(values.packetaPoint);
  }

  return values.deliveryMethod === "pickup";
}

export function isOrderContactStepComplete(
  values: Pick<OrderFormValues, "firstName" | "lastName" | "email" | "phone">,
  errors: FieldErrors<OrderFormValues>,
) {
  if (
    errors.firstName ||
    errors.lastName ||
    errors.email ||
    errors.phone
  ) {
    return false;
  }

  return (
    values.firstName.trim().length > 0 &&
    values.lastName.trim().length > 0 &&
    values.email.trim().length > 0 &&
    values.phone.trim().length > 0
  );
}

export function isOrderNoteStepComplete(
  values: Pick<OrderFormValues, "note">,
  errors: FieldErrors<OrderFormValues>,
) {
  if (errors.note) {
    return false;
  }

  return (values.note?.trim().length ?? 0) > 0;
}

export function getOrderFormStepCompletion(
  values: OrderFormValues,
  errors: FieldErrors<OrderFormValues>,
) {
  const calendarType = values.types;
  const hasPremiumFeatures =
    calendarType === "premium" || calendarType === "memory";
  const isMemory = calendarType === "memory";

  const type = isOrderTypeStepComplete(values);
  const quantity = isOrderQuantityStepComplete(values);
  const photos = isOrderPhotosStepComplete(values);
  const dedication = isMemory
    ? isOrderDedicationStepComplete(errors)
    : true;
  const delivery = isOrderDeliveryStepComplete(values, errors);
  const contact = isOrderContactStepComplete(values, errors);
  const note = isOrderNoteStepComplete(values, errors);

  const birthdays = hasPremiumFeatures
    ? isOrderBirthdaysStepComplete(values, errors, delivery, contact)
    : true;
  const namedays = hasPremiumFeatures
    ? isOrderNamedaysStepComplete(values, errors, delivery, contact)
    : true;

  const orderedSteps: OrderFormStepId[] =
    calendarType === "basic"
      ? ["type", "quantity", "photos", "delivery", "contact", "note"]
      : isMemory
        ? [
            "type",
            "quantity",
            "photos",
            "dedication",
            "birthdays",
            "namedays",
            "delivery",
            "contact",
            "note",
          ]
        : [
            "type",
            "quantity",
            "photos",
            "birthdays",
            "namedays",
            "delivery",
            "contact",
            "note",
          ];

  const steps: Record<OrderFormStepId, boolean> = {
    type,
    quantity,
    photos,
    dedication,
    birthdays,
    namedays,
    delivery,
    contact,
    note,
  };

  const activeStep =
    [...orderedSteps].reverse().find((stepId) => steps[stepId]) ?? "type";

  return { steps, activeStep };
}
