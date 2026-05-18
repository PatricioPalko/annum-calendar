import { Control, Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { OrderFormValues } from "@/lib/schema";

type InputNumberFieldProps = {
  control: Control<OrderFormValues>;
  isBusinessType: boolean;
};

export function FormNumberInput({
  control,
  isBusinessType,
}: InputNumberFieldProps) {
  return (
    <Controller
      name="customQuantity"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="customQuantity">Vlastný počet kusov</FieldLabel>

          <Input
            id="customQuantity"
            type="number"
            min={isBusinessType ? 10 : 1}
            max={100}
            inputMode="numeric"
            placeholder="Napr. 10"
            value={field.value ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              field.onChange(value === "" ? undefined : Number(value));
            }}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            aria-invalid={fieldState.invalid}
          />

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
