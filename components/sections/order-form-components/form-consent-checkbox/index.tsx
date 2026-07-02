import { Control, Controller } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError } from "@/components/ui/field";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";

type FormConsentCheckboxProps = {
  control: Control<OrderFormValues>;
  className?: string;
};

export function FormConsentCheckbox({
  control,
  className,
}: FormConsentCheckboxProps) {
  return (
    <Controller
      name="termsAccepted"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <label
            className={cn(
              "group flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-1.5 transition",
              "hover:border-[#EAD6DE] hover:bg-[#FFF7F4]",
              fieldState.invalid && "border-[#FC5A61]/30 bg-[#FFF7F4]",
            )}
          >
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-invalid={fieldState.invalid}
              className={cn(
                "mt-0.5 cursor-pointer transition",
                "group-hover:border-[#3E0F28]",
              )}
            />

            <span className="cursor-pointer text-sm font-medium leading-6 text-[#3E0F28]/75 transition group-hover:text-[#3E0F28]">
              Súhlasím so spracovaním údajov potrebných na vybavenie objednávky.
            </span>
          </label>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
