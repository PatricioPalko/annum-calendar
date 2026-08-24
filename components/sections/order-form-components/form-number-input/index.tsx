import { Control, Controller } from "react-hook-form";

import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";

import { orderFormBirthdayControlClassName } from "../order-form-styles";

type InputNumberFieldProps = {
  control: Control<OrderFormValues>;
  layout?: "default" | "card" | "card-block";
};

export function FormNumberInput({
  control,
  layout = "default",
}: InputNumberFieldProps) {
  return (
    <Controller
      name="customQuantity"
      control={control}
      render={({ field, fieldState }) => {
        const input = (
          <div
            className={cn(
              "relative",
              layout === "card"
                ? "w-[4.75rem]"
                : layout === "card-block"
                  ? "w-full max-w-[7.5rem]"
                  : "w-full",
            )}
          >
            <Input
              id="customQuantity"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              placeholder={layout === "card" ? "10" : "Napr. 10"}
              value={
                field.value === undefined || field.value === null
                  ? ""
                  : String(field.value)
              }
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/\D/g, "");

                if (digitsOnly === "") {
                  field.onChange(undefined);
                  return;
                }

                const parsed = Number(digitsOnly);

                if (parsed < 1) {
                  field.onChange(undefined);
                  return;
                }

                field.onChange(parsed);
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              aria-invalid={fieldState.invalid}
              aria-label="Vlastný počet kusov"
              className={cn(
                orderFormBirthdayControlClassName,
                layout === "card" ? "h-8 px-2.5 pr-8 sm:h-8 sm:px-2.5" : "pr-12",
              )}
            />

            <span
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 font-semibold text-[#3E0F28]/60",
                layout === "card"
                  ? "right-2 text-xs"
                  : "right-4 text-sm",
              )}
            >
              ks
            </span>
          </div>
        );

        if (layout === "card" || layout === "card-block") {
          return (
            <div className="space-y-1">
              {input}
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </div>
          );
        }

        return (
          <div className="space-y-1.5">
            {input}
            {fieldState.invalid ? (
              <FieldError errors={[fieldState.error]} />
            ) : null}
          </div>
        );
      }}
    />
  );
}
