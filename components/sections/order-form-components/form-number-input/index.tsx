import { Control, Controller } from "react-hook-form";

import { Field, FieldError } from "@/components/ui/field";
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
  const minValue = isBusinessType ? 10 : 1;

  return (
    <Controller
      name="customQuantity"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="relative">
            <Input
              id="customQuantity"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              placeholder={isBusinessType ? "Napr. 25" : "Napr. 10"}
              value={field.value ?? ""}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/\D/g, "");

                if (digitsOnly === "") {
                  field.onChange(undefined);
                  return;
                }

                field.onChange(Number(digitsOnly));
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              aria-invalid={fieldState.invalid}
              className="h-12 pr-14 text-md font-bold"
            />

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-md22 font-bold text-[#3E0F28]/60">
              ks
            </span>
          </div>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
