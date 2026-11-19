import { getDeliveryPrice } from "@/helpers/delivery";

import { PriceWithVat } from "@/components/ui/price-with-vat";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

import {
  orderFormOptionCardClassName,
  orderFormPriceClassName,
  orderFormPriceVatClassName,
} from "../order-form-styles";

/** Personal pickup in Košice is the only delivery method. */
export function FormDeliveryMethod() {
  return (
    <div
      data-selected="true"
      className={cn(
        orderFormOptionCardClassName,
        "max-w-lg cursor-default grid-cols-1 hover:border-[#FC5A61] hover:bg-[#FFF7F4]",
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-[#EAD6DE]">
          <MapPin className="size-4 text-secondary" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-tight text-foreground">
            Osobný odber v Košiciach
          </p>
          <p className="mt-0.5 text-sm leading-snug text-[#3E0F28]/60">
            Keď bude kalendár hotový, ozveme sa a dohodneme čas odberu.
          </p>
        </div>

        <PriceWithVat
          value={getDeliveryPrice()}
          className={cn("shrink-0 self-start", orderFormPriceClassName)}
          vatClassName={orderFormPriceVatClassName}
        />
      </div>
    </div>
  );
}
