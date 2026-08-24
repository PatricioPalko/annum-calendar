"use client";

import { Control, Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MAX_DEDICATION_LENGTH } from "@/lib/order/config";
import type { OrderFormValues } from "@/lib/schema";

import { orderFormInputClassName } from "../order-form-styles";

type FormDedicationProps = {
  control: Control<OrderFormValues>;
  quantity: number;
};

export function FormDedication({ control, quantity }: FormDedicationProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: quantity }, (_, index) => {
        const inputId = `form-dedication-${index + 1}`;
        const errorId = `${inputId}-error`;

        return (
          <Controller
            key={inputId}
            name={`dedications.${index}`}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={inputId}>
                  {quantity > 1
                    ? `Venovanie — kalendár ${index + 1}`
                    : "Venovanie"}
                </FieldLabel>
                <Input
                  id={inputId}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={() => {
                    field.onChange(field.value ?? "");
                    field.onBlur();
                  }}
                  placeholder="Napr. Pre našu maminku s láskou"
                  maxLength={MAX_DEDICATION_LENGTH}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? errorId : undefined}
                  className={orderFormInputClassName}
                />
                {fieldState.invalid ? (
                  <FieldError id={errorId} errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        );
      })}

      <p className="text-xs font-medium text-[#3E0F28]/55">
        Voliteľné — každé venovanie vytlačíme priamo v príslušnom kalendári.
      </p>
    </div>
  );
}
