import { Control, Controller } from "react-hook-form";

import {
  getLowestUnitPrice,
  type CalendarTypesOption,
} from "@/app/types/types";
import { FieldError, FieldSet } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PriceWithVat } from "@/components/ui/price-with-vat";
import {
  orderFormRecommendedBadgeClassName,
  recommendedBadgeLabel,
  RecommendedBadge,
} from "@/components/ui/recommended-badge";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";
import {
  orderFormOptionCardClassName,
  orderFormPriceClassName,
  orderFormPriceVatClassName,
  orderFormRadioClassName,
} from "../order-form-styles";

type RadioGroupFieldProps = {
  control: Control<OrderFormValues>;
  name: "types";
  label: string;
  options: CalendarTypesOption[];
};

export function FormRadioGroup({
  control,
  name,
  label,
  options,
}: RadioGroupFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid}>
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            aria-label={label}
            aria-invalid={fieldState.invalid}
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {options.map((plan) => {
              const id = `calendar-type-${plan.value}`;
              const isSelected = field.value === plan.value;
              const lowestUnitPrice = getLowestUnitPrice(plan);
              const isRecommended = plan.value === "premium";

              return (
                <label
                  key={plan.value}
                  htmlFor={id}
                  data-selected={isSelected ? "true" : "false"}
                  className={orderFormOptionCardClassName}
                >
                  {isRecommended ? (
                    <RecommendedBadge
                      variant="lime"
                      className={orderFormRecommendedBadgeClassName}
                    >
                      {recommendedBadgeLabel}
                    </RecommendedBadge>
                  ) : null}

                  <RadioGroupItem
                    id={id}
                    value={plan.value}
                    aria-invalid={fieldState.invalid}
                    className={cn(orderFormRadioClassName, "col-start-1 row-start-1")}
                  />

                  <p className="col-start-2 row-start-1 self-center text-base font-bold leading-tight text-foreground">
                    {plan.label}
                  </p>

                  <div className="col-span-2 row-start-2 space-y-1.5 border-t border-[#EAD6DE]/70 pt-2.5">
                    <p className="text-sm leading-snug text-[#3E0F28]/60">
                      {plan.description}
                    </p>

                    {lowestUnitPrice !== null ? (
                      <p className="text-sm font-semibold text-[#3E0F28]/55">
                        od{" "}
                        <PriceWithVat
                          value={lowestUnitPrice}
                          perUnit
                          className={orderFormPriceClassName}
                          vatClassName={orderFormPriceVatClassName}
                        />
                      </p>
                    ) : (
                      <p className={orderFormPriceClassName}>
                        {plan.priceNote ?? "Cena na mieru"}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </FieldSet>
      )}
    />
  );
}
