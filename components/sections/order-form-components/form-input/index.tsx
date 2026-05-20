import { Control, Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { OrderFormValues } from "@/lib/schema";

type TextInputName = "firstName" | "lastName" | "email" | "phone";
type Type = "text" | "email" | "tel";

type InputFieldProps = {
  control: Control<OrderFormValues>;
  name: TextInputName;
  label: string;
  autoComplete?: string;
  type: Type;
  placeholder?: string;
};

export function FormInput({
  control,
  name,
  label,
  autoComplete,
  type,
  placeholder,
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
            type={type}
            placeholder={placeholder}
          />

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
