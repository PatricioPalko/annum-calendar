import { Control, Controller, FieldPath } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";

import {
  calendarTypes,
  CUSTOM_QUANTITY_VALUE,
  FixedPriceQuantity,
  quantityItems,
} from "@/app/types/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { OrderFormValues } from "@/lib/schema";

type QuantityFieldProps = {
  control: Control<OrderFormValues>;
  name: FieldPath<OrderFormValues>;
  label: string;
  selectedCalendarType: string;
};

export function FormQuantity({
  control,
  name,
  label,
  selectedCalendarType,
}: QuantityFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>

          <RadioGroup
            value={String(field.value)}
            onValueChange={(value) => {
              field.onChange(Number(value));
            }}
            className="grid gap-3 sm:grid-cols-4"
          >
            {quantityItems.map((item) => {
              const isBusiness = selectedCalendarType === "business";
              const isPresetQuantity = item.value !== CUSTOM_QUANTITY_VALUE;
              const isDisabled = isBusiness && isPresetQuantity;
              const isSelected = field.value === item.value;

              const selectedPlan = calendarTypes.find(
                (plan) => plan.value === selectedCalendarType,
              );

              const price =
                item.value !== CUSTOM_QUANTITY_VALUE && selectedPlan
                  ? selectedPlan.prices[item.value as FixedPriceQuantity]
                  : undefined;

              const pricePerPiece =
                price && item.value !== CUSTOM_QUANTITY_VALUE
                  ? price / item.value
                  : undefined;

              return (
                <label
                  key={item.value}
                  data-selected={isSelected}
                  data-disabled={isDisabled}
                  className={[
                    "cursor-pointer rounded-2xl border p-4 transition",
                    "data-[selected=true]:border-primary data-[selected=true]:bg-surface data-[selected=true]:shadow-sm",
                    "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40",
                    !isSelected && !isDisabled
                      ? "border-border bg-surface hover:bg-surface-soft"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value={String(item.value)}
                        disabled={isDisabled}
                      />

                      <span className="font-bold text-foreground">
                        {item.label}
                      </span>

                      {price && (
                        <span className="ml-auto font-bold text-secondary">
                          {price} €
                        </span>
                      )}
                    </div>

                    {pricePerPiece && (
                      <p className="text-sm font-medium text-primary">
                        {pricePerPiece.toFixed(2).replace(".", ",")} € / 1 ks
                      </p>
                    )}

                    {item.value === CUSTOM_QUANTITY_VALUE && (
                      <p className="text-sm font-medium text-muted">
                        Zadajte vlastný počet kusov
                      </p>
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
