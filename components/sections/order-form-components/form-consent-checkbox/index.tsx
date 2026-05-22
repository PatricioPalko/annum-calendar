import { Control, Controller } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError } from "@/components/ui/field";
import type { OrderFormValues } from "@/lib/schema";

type FormConsentCheckboxProps = {
  control: Control<OrderFormValues>;
};

export function FormConsentCheckbox({ control }: FormConsentCheckboxProps) {
  return (
    <Controller
      name="termsAccepted"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <label className="flex cursor-pointer items-start gap-3 my-4 mx-2 transition">
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-invalid={fieldState.invalid}
              className="mt-0.5"
            />

            <span className="text-sm font-medium leading-6 text-[#3E0F28]/75">
              Súhlasím so spracovaním údajov potrebných na vybavenie objednávky.
            </span>
          </label>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
