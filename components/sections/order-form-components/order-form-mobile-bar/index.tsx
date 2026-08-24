"use client";

import {
  getCalendarPrice,
  type CalendarTypes,
  type QuantityOption,
} from "@/app/types/types";
import { getDeliveryPrice } from "@/helpers/delivery";
import { getDiscountAmount } from "@/helpers/discount-codes";
import { PriceWithVat } from "@/components/ui/price-with-vat";
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
  submitDisabled?: boolean;
};


export function OrderFormMobileBar({
  type,
  quantityOption,
  customQuantity,
  deliveryMethod,
  discountCode = "",
  isSubmitting,
  submitDisabled = false,
}: OrderFormMobileBarProps) {
  const price = getCalendarPrice({ type, quantityOption, customQuantity });
  const discount = getDiscountAmount(price.totalPrice, discountCode);
  const deliveryPrice = getDeliveryPrice(deliveryMethod);
  const totalPrice =
    discount.finalPrice !== null ? discount.finalPrice + deliveryPrice : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAD6DE] bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(62,15,40,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#FC5A61]">
            Celkom
          </p>
          <p className="truncate font-heading text-lg font-extrabold text-[#3E0F28] sm:text-xl">
            {totalPrice !== null ? (
              <PriceWithVat
                value={totalPrice}
                vatClassName="text-[0.55em] font-medium text-[#3E0F28]/45"
              />
            ) : (
              "Cena na mieru"
            )}
          </p>
        </div>

        <Button
          type="submit"
          form="order-form"
          size="lg"
          variant="lime"
          className="shrink-0 px-5"
          disabled={isSubmitting || submitDisabled}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Dokončujem...
            </>
          ) : (
            "Dokončiť"
          )}
        </Button>
      </div>
    </div>
  );
}
