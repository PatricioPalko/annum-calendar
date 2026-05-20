import { Control, Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { OrderFormValues } from "@/lib/schema";

type TextInputName = "firstName" | "lastName";

type InputFieldProps = {
  control: Control<OrderFormValues>;
  name: TextInputName;
  label: string;
  autoComplete?: string;
};

export function FormInput({
  control,
  name,
  label,
  autoComplete,
}: InputFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`form-${name}`}>{label}</FieldLabel>

          <Input
            {...field}
            id={`form-${name}`}
            aria-invalid={fieldState.invalid}
            autoComplete={autoComplete}
          />

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
