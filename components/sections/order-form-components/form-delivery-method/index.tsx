import { MapPin, Package } from "lucide-react";
import { Control, Controller } from "react-hook-form";

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

type DeliveryMethodFieldProps = {
  control: Control<OrderFormValues>;
};

const deliveryOptions = [
  {
    value: "pickup",
    label: "Osobný odber",
    description: "Kalendár si prevezmete osobne po dohode.",
    price: "0 €",
    icon: MapPin,
  },
  {
    value: "packeta",
    label: "Packeta",
    description: "Vyberiete si výdajné miesto alebo Z-BOX.",
    price: "3,90 €",
    icon: Package,
  },
] as const;

export function FormDeliveryMethod({ control }: DeliveryMethodFieldProps) {
  return (
    <Controller
      name="deliveryMethod"
      control={control}
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid} className="space-y-4">
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            aria-invalid={fieldState.invalid}
            className="grid gap-3 md:grid-cols-2"
          >
            {deliveryOptions.map((option) => {
              const id = `delivery-method-${option.value}`;
              const isSelected = field.value === option.value;
              const Icon = option.icon;

              return (
                <label
                  key={option.value}
                  htmlFor={id}
                  data-selected={isSelected ? "true" : "false"}
                  className={cn(
                    "relative flex min-h-36 cursor-pointer flex-col rounded-md border border-[#EAD6DE] bg-white p-4 shadow-sm transition-all duration-200",
                    "hover:border-[#FC5A61]/50 hover:bg-[#FFF7F4] hover:shadow-md",
                    "data-[selected=true]:border-secondary data-[selected=true]:bg-[#FFF7F4] data-[selected=true]:shadow-md",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        id={id}
                        value={option.value}
                        aria-invalid={fieldState.invalid}
                        className="mt-0.5"
                      />

                      <Field orientation="vertical" className="gap-1">
                        <FieldContent>
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-secondary" />

                            <FieldTitle className="text-md font-bold text-foreground">
                              {option.label}
                            </FieldTitle>
                          </div>

                          <FieldDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                            {option.description}
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-[#EAD6DE] pt-2">
                    <p className="text-sm font-semibold text-primary">
                      Cena doručenia{" "}
                      <span className="font-heading text-xl font-bold text-secondary">
                        {option.price}
                      </span>
                    </p>
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
