import { Control, Controller } from "react-hook-form";

import { FieldError, FieldSet } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getPaymentMethodLabel,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/helpers/payment-method";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { Banknote, Landmark } from "lucide-react";

import {
  orderFormOptionCardClassName,
  orderFormRadioClassName,
} from "../order-form-styles";

const paymentMethodDetails: Record<
  PaymentMethod,
  { description: string; icon: typeof Landmark }
> = {
  bank_transfer: {
    description: "Platobné údaje Vám pošleme e-mailom hneď po objednaní.",
    icon: Landmark,
  },
  cash: {
    description: "Zaplatíte pri osobnom odbere kalendára.",
    icon: Banknote,
  },
};

type FormPaymentMethodProps = {
  control: Control<OrderFormValues>;
};

export function FormPaymentMethod({ control }: FormPaymentMethodProps) {
  return (
    <Controller
      name="paymentMethod"
      control={control}
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid} className="gap-3">
          <RadioGroup
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            aria-label="Spôsob platby"
            aria-invalid={fieldState.invalid}
            className="grid gap-3 sm:grid-cols-2"
          >
            {PAYMENT_METHODS.map((method) => {
              const id = `payment-method-${method}`;
              const { description, icon: Icon } = paymentMethodDetails[method];

              return (
                <label
                  key={method}
                  htmlFor={id}
                  data-selected={field.value === method ? "true" : "false"}
                  className={orderFormOptionCardClassName}
                >
                  <RadioGroupItem
                    id={id}
                    value={method}
                    aria-invalid={fieldState.invalid}
                    className={cn(
                      orderFormRadioClassName,
                      "col-start-1 row-start-1 mt-2 self-start",
                    )}
                  />

                  <div className="col-start-2 row-start-1 flex min-w-0 items-start gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-[#EAD6DE]">
                      <Icon className="size-4 text-secondary" aria-hidden />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold leading-tight text-foreground">
                        {getPaymentMethodLabel(method)}
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-[#3E0F28]/60">
                        {description}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          {fieldState.invalid ? (
            <FieldError errors={[fieldState.error]} />
          ) : null}
        </FieldSet>
      )}
    />
  );
}
