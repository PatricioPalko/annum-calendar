import Link from "next/link";
import type { ReactNode } from "react";
import { Control, Controller } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError } from "@/components/ui/field";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";

type FormConsentCheckboxProps = {
  control: Control<OrderFormValues>;
  className?: string;
};

function ConsentLabel({
  checked,
  invalid,
  onCheckedChange,
  children,
}: {
  checked: boolean;
  invalid: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-1.5 transition",
        "hover:border-[#EAD6DE] hover:bg-[#FFF7F4]",
        invalid && "border-[#FC5A61]/30 bg-[#FFF7F4]",
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-invalid={invalid}
        className={cn(
          "mt-0.5 cursor-pointer transition",
          "group-hover:border-[#3E0F28]",
        )}
      />

      <span className="cursor-pointer text-sm font-medium leading-6 text-[#3E0F28]/75 transition group-hover:text-[#3E0F28]">
        {children}
      </span>
    </label>
  );
}

export function FormConsentCheckbox({
  control,
  className,
}: FormConsentCheckboxProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Controller
        name="termsAccepted"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <ConsentLabel
              checked={field.value}
              invalid={fieldState.invalid}
              onCheckedChange={field.onChange}
            >
              Súhlasím s{" "}
              <Link
                href="/obchodne-podmienky"
                className="font-bold text-[#FC5A61] underline-offset-2 hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                obchodnými podmienkami
              </Link>{" "}
              a so spracovaním osobných údajov potrebných na vybavenie
              objednávky podľa{" "}
              <Link
                href="/ochrana-osobnych-udajov"
                className="font-bold text-[#FC5A61] underline-offset-2 hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                zásad ochrany osobných údajov
              </Link>
              .
            </ConsentLabel>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="marketingConsent"
        control={control}
        render={({ field }) => (
          <Field>
            <ConsentLabel
              checked={field.value ?? false}
              invalid={false}
              onCheckedChange={field.onChange}
            >
              Chcem dostávať novinky a informácie o produktoch Annum na môj
              e-mail. Súhlas môžem kedykoľvek odvolať.
            </ConsentLabel>
          </Field>
        )}
      />
    </div>
  );
}
