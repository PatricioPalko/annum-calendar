import { Control, Controller } from "react-hook-form";

import {
  calendarTypes,
  CUSTOM_QUANTITY_VALUE,
  type FixedPriceQuantity,
  quantityItems,
} from "@/app/types/types";
import { Field, FieldError } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
import { FormNumberInput } from "../form-number-input";

type QuantityFieldProps = {
  control: Control<OrderFormValues>;
  name: "quantityOption";
  label: string;
  selectedCalendarType: OrderFormValues["types"];
};

function formatPrice(value: number) {
  return Number.isInteger(value)
    ? `${value} €`
    : `${value.toFixed(2).replace(".", ",")} €`;
}

export function FormQuantity({
  control,
  name,
  label,
  selectedCalendarType,
}: QuantityFieldProps) {
  const selectedPlan = calendarTypes.find(
    (plan) => plan.value === selectedCalendarType,
  );

  const singlePiecePrice = selectedPlan?.prices[1] ?? null;
  const isBusiness = selectedCalendarType === "business";

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          {/* <div className="space-y-1"> */}
          {/* <FieldLabel>{label}</FieldLabel>
            <p className="text-sm leading-6 text-muted-foreground">
              Vyberte počet rovnakých kusov. Pri väčšom množstve sa cena za kus
              automaticky zníži.
            </p> */}
          {/* </div> */}

          <RadioGroup
            value={String(field.value)}
            onValueChange={(value) => {
              field.onChange(Number(value));
            }}
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {quantityItems.map((item) => {
              const isCustom = item.value === CUSTOM_QUANTITY_VALUE;
              const isPresetQuantity = !isCustom;
              const isDisabled = isBusiness && isPresetQuantity;
              const isSelected = field.value === item.value;

              const totalPrice =
                isPresetQuantity && selectedPlan
                  ? selectedPlan.prices[item.value as FixedPriceQuantity]
                  : undefined;

              const pricePerPiece =
                totalPrice && isPresetQuantity
                  ? totalPrice / item.value
                  : undefined;

              const hasDiscount =
                singlePiecePrice !== null &&
                pricePerPiece !== undefined &&
                item.value > 1 &&
                pricePerPiece < singlePiecePrice;

              const isRecommended = item.value === 3 && !isBusiness;

              return (
                <label
                  key={item.value}
                  data-selected={isSelected ? "true" : "false"}
                  data-disabled={isDisabled ? "true" : "false"}
                  className={cn(
                    "relative flex min-h-36 cursor-pointer flex-col overflow-hidden rounded-md border border-[#EAD6DE] bg-white p-4 shadow-sm transition-all duration-200",
                    "hover:border-[#FC5A61]/50 hover:bg-[#FFF7F4] hover:shadow-md",
                    "data-[selected=true]:border-[#FC5A61] data-[selected=true]:bg-[#FFF7F4] data-[selected=true]:ring-4 data-[selected=true]:ring-[#FC5A61]/10",
                    "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40 data-[disabled=true]:hover:border-[#EAD6DE] data-[disabled=true]:hover:bg-white data-[disabled=true]:hover:shadow-sm",
                  )}
                >
                  {isRecommended && (
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#C8FF3D] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#3E0F28]">
                      <BadgeCheck className="size-3.5" />
                      Obľúbený
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      value={String(item.value)}
                      disabled={isDisabled}
                      className="mt-0.5"
                    />

                    <div className="min-w-0 flex-1 mt-1">
                      <p className="font-bold leading-none text-foreground">
                        {item.label}
                      </p>

                      {isCustom ? (
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">
                          Zadajte vlastný počet kusov.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">
                          {hasDiscount
                            ? "Zvýhodnená cena za kus"
                            : "Štandardná cena"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col justify-end">
                    {isCustom ? (
                      <div className="space-y-2">
                        {isBusiness && (
                          <p className="text-xs font-semibold text-secondary">
                            Business objednávka je od 10 kusov.
                          </p>
                        )}

                        <FormNumberInput
                          control={control}
                          isBusinessType={isBusiness}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pricePerPiece !== undefined && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Cena za 1 kalendár
                            </p>

                            <div className="mt-1 flex items-baseline gap-2">
                              {hasDiscount && singlePiecePrice !== null && (
                                <span className="text-sm font-semibold text-primary/60 line-through">
                                  {formatPrice(singlePiecePrice)}
                                </span>
                              )}

                              <span className="font-heading text-lg font-bold text-primary">
                                {formatPrice(pricePerPiece)}
                              </span>
                            </div>
                          </div>
                        )}

                        {totalPrice !== undefined && (
                          <div className="border-t border-[#EAD6DE] pt-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-muted-foreground">
                                Spolu
                              </span>

                              <span className="font-heading text-2xl font-bold text-secondary">
                                {formatPrice(totalPrice)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
