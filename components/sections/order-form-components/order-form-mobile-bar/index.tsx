"use client";

import {
  calendarTypes,
  getCalendarPrice,
  type CalendarTypes,
  type QuantityOption,
} from "@/app/types/types";
import { getDeliveryPrice } from "@/helpers/delivery";
import { getDiscountAmount } from "@/helpers/discount-codes";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type DeliveryMethod = "pickup" | "packeta";

type OrderFormMobileBarProps = {
  type: CalendarTypes;
  quantityOption: QuantityOption;
  customQuantity?: number;
  deliveryMethod: DeliveryMethod;
  discountCode?: string;
  isSubmitting: boolean;
};

function formatPrice(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

export function OrderFormMobileBar({
  type,
  quantityOption,
  customQuantity,
  deliveryMethod,
  discountCode = "",
  isSubmitting,
}: OrderFormMobileBarProps) {
  const price = getCalendarPrice({ type, quantityOption, customQuantity });
  const discount = getDiscountAmount(price.totalPrice, discountCode);
  const deliveryPrice = getDeliveryPrice(deliveryMethod);

  const totalPrice =
    discount.finalPrice !== null ? discount.finalPrice + deliveryPrice : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAD6DE] bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(62,15,40,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#FC5A61]">
            Celkom
          </p>
          <p className="truncate text-xl font-extrabold text-[#3E0F28]">
            {totalPrice !== null ? formatPrice(totalPrice) : "Cena na mieru"}
          </p>
        </div>

        <Button
          type="submit"
          form="order-form"
          size="lg"
          className="shrink-0 px-5"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Odosielam...
            </>
          ) : (
            "Odoslať"
          )}
        </Button>
      </div>
    </div>
  );
}
