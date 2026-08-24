import { Control, Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { OrderFormValues } from "@/lib/schema";

import { orderFormInputClassName } from "../order-form-styles";

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
      render={({ field, fieldState }) => {
        const inputId = `form-${name}`;
        const errorId = `${inputId}-error`;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={inputId}>{label}</FieldLabel>

            <Input
              {...field}
              id={inputId}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? errorId : undefined}
              autoComplete={autoComplete}
              type={type}
              placeholder={placeholder}
              className={orderFormInputClassName}
            />

            {fieldState.invalid && (
              <FieldError id={errorId} errors={[fieldState.error]} />
            )}
          </Field>
        );
      }}
    />
  );
}
