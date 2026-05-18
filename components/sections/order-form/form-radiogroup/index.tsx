import { Control, Controller, FieldPath } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";

import { CalendarTypesOption } from "@/app/types/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { OrderFormValues } from "@/lib/schema";

type RadioGroupFieldProps = {
  control: Control<OrderFormValues>;
  name: FieldPath<OrderFormValues>;
  label: string;
  options: CalendarTypesOption[];
};

export function FormRadioGroup({
  control,
  name,
  label,
  options,
}: RadioGroupFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <RadioGroup
            name={field.name}
            value={String(field.value)}
            onValueChange={field.onChange}
            aria-invalid={fieldState.invalid}
            className="flex gap-4"
          >
            {options.map((plan: CalendarTypesOption) => (
              <FieldLabel
                key={plan.value}
                htmlFor={`form-rhf-radiogroup-${plan.value}`}
              >
                <Field
                  orientation="horizontal"
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent>
                    <FieldTitle>{plan.label}</FieldTitle>
                    <FieldDescription>{plan.description}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem
                    value={plan.value}
                    id={`form-rhf-radiogroup-${plan.value}`}
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </FieldSet>
      )}
    />
  );
}
