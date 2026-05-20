import { Control, Controller } from "react-hook-form";

import { Field, FieldError } from "@/components/ui/field";
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
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Textarea
            id={`form-${name}`}
            name={field.name}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
          />

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
