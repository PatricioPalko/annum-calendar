import { Control, Controller } from "react-hook-form";

import {
  getLowestUnitPrice,
  type CalendarTypesOption,
} from "@/app/types/types";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";

type RadioGroupFieldProps = {
  control: Control<OrderFormValues>;
  name: "types";
  label: string;
  options: CalendarTypesOption[];
};

function formatPrice(value: number) {
  return Number.isInteger(value)
    ? `${value} €`
    : `${value.toFixed(2).replace(".", ",")} €`;
}

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
        <FieldSet data-invalid={fieldState.invalid} className="space-y-4">
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            aria-invalid={fieldState.invalid}
            className="grid gap-3 md:grid-cols-3"
          >
            {options.map((plan) => {
              const id = `calendar-type-${plan.value}`;
              const isSelected = field.value === plan.value;
              const isBusiness = plan.value === "business";
              const lowestUnitPrice = getLowestUnitPrice(plan);

              return (
                <label
                  key={plan.value}
                  htmlFor={id}
                  data-selected={isSelected ? "true" : "false"}
                  className={cn(
                    "relative flex min-h-52 cursor-pointer flex-col overflow-hidden rounded-md border border-[#EAD6DE] bg-white p-4 shadow-sm transition-all duration-200",
                    "hover:border-[#FC5A61]/50 hover:bg-[#FFF7F4] hover:shadow-md",
                    "data-[selected=true]:border-[#FC5A61] data-[selected=true]:bg-[#FFF7F4] data-[selected=true]:ring-4 data-[selected=true]:ring-[#FC5A61]/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        id={id}
                        value={plan.value}
                        aria-invalid={fieldState.invalid}
                        className="mt-0.5"
                      />

                      <Field orientation="vertical" className="gap-1">
                        <FieldContent>
                          <FieldTitle className="text-md font-bold text-foreground">
                            {plan.label}
                          </FieldTitle>

                          <FieldDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                            {plan.description}
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    </div>
                    {plan.value === "premium" && (
                      <span
                        className={cn(
                          "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#C8FF3D] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#3E0F28]",
                          plan.value === "premium"
                            ? "bg-lime text-[#3E0F28]"
                            : "bg-soft/60 text-[#3E0F28]",
                        )}
                      >
                        <BadgeCheck className="size-3.5" />
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto border-t border-[#EAD6DE] pt-4">
                    {isBusiness ? (
                      <p className="font-heading text-xl font-bold text-secondary">
                        {plan.priceNote ?? "Cena na mieru"}
                      </p>
                    ) : (
                      lowestUnitPrice !== null && (
                        <p className="text-sm font-semibold text-primary">
                          už od{" "}
                          <span className="font-heading text-2xl font-bold text-secondary">
                            {formatPrice(lowestUnitPrice)}
                          </span>{" "}
                          / ks
                        </p>
                      )
                    )}
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </FieldSet>
      )}
    />
  );
}
