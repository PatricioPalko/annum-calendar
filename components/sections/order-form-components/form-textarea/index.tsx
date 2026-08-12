import { Control, Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { OrderFormValues } from "@/lib/schema";

type FormTextareaProps = {
  control: Control<OrderFormValues>;
  name: "note";
  label: string;
  description?: string;
  placeholder?: string;
};

export function FormTextarea({
  control,
  name,
  label,
  description,
  placeholder,
}: FormTextareaProps) {
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

            <Textarea
              id={inputId}
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? errorId : undefined}
            />

            {description && (
              <p className="text-sm font-medium text-[#3E0F28]/55">{description}</p>
            )}

            {fieldState.invalid && (
              <FieldError id={errorId} errors={[fieldState.error]} />
            )}
          </Field>
        );
      }}
    />
  );
}
