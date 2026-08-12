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
import { formatEuroPrice } from "@/helpers/format-euro-price";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";

type RadioGroupFieldProps = {
  control: Control<OrderFormValues>;
  name: "types";
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
              const lowestUnitPrice = getLowestUnitPrice(plan);

              return (
                <label
                  key={plan.value}
                  htmlFor={id}
                  data-selected={isSelected ? "true" : "false"}
                  className={cn(
                    "relative flex cursor-pointer flex-col rounded-md border border-[#EAD6DE] bg-white p-3 shadow-sm transition-all duration-200",
                    "hover:border-[#FC5A61]/50 hover:bg-[#FFF7F4] hover:shadow-md",
                    "data-[selected=true]:border-secondary data-[selected=true]:bg-[#FFF7F4] data-[selected=true]:shadow-md",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <RadioGroupItem
                        id={id}
                        value={plan.value}
                        aria-invalid={fieldState.invalid}
                        className="mt-0.5"
                      />

                      <Field orientation="vertical" className="gap-0.5">
                        <FieldContent>
                          <FieldTitle className="font-bold normal-case text-foreground">
                            {plan.label}
                          </FieldTitle>

                          <FieldDescription className="mt-0.5 text-sm leading-5 text-muted-foreground">
                            {plan.description}
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    </div>
                    {plan.value === "premium" && (
                      <span
                        className={cn(
                          "absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#C8FF3D] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#3E0F28] shadow-sm",
                        )}
                      >
                        <BadgeCheck className="size-3" />
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 border-t border-[#EAD6DE] pt-2">
                    {lowestUnitPrice !== null ? (
                      <p className="text-sm font-semibold text-primary">
                        od{" "}
                        <span className="whitespace-nowrap font-heading text-xl font-bold text-secondary sm:text-2xl">
                          {formatEuroPrice(lowestUnitPrice)}
                        </span>{" "}
                        / ks
                      </p>
                    ) : (
                      <p className="font-heading text-xl font-bold text-secondary">
                        {plan.priceNote ?? "Cena na mieru"}
                      </p>
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
