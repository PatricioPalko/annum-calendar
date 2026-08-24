import { getDeliveryPrice } from "@/helpers/delivery";
import { Control, Controller } from "react-hook-form";
import type { ReactNode } from "react";

import { PacketaPicker } from "@/components/delivery/packeta-picker";
import { Field, FieldError, FieldSet } from "@/components/ui/field";
import { PriceWithVat } from "@/components/ui/price-with-vat";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { MapPin, Package } from "lucide-react";

import {
  orderFormOptionCardClassName,
  orderFormPriceClassName,
  orderFormPriceVatClassName,
  orderFormRadioClassName,
} from "../order-form-styles";

type DeliveryMethodFieldProps = {
  control: Control<OrderFormValues>;
  showPickup?: boolean;
  isSubmitting?: boolean;
};

const pickupOption = {
  value: "pickup" as const,
  label: "Osobný odber",
  description: "Prevezmete v Košiciach po dohode.",
  priceValue: 0,
  icon: MapPin,
};

const packetaOption = {
  value: "packeta" as const,
  label: "Packeta",
  description: "Výdajné miesto alebo Z-BOX na Slovensku.",
  priceValue: getDeliveryPrice("packeta"),
  icon: Package,
};

function DeliveryOptionHeader({
  icon: Icon,
  label,
  description,
  priceValue,
}: {
  icon: typeof MapPin;
  label: string;
  description: string;
  priceValue: number;
}) {
  return (
    <>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-[#EAD6DE]">
        <Icon className="size-4 text-secondary" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-bold leading-tight text-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm leading-snug text-[#3E0F28]/60">
          {description}
        </p>
      </div>

      <PriceWithVat
        value={priceValue}
        className={cn("shrink-0 self-start", orderFormPriceClassName)}
        vatClassName={orderFormPriceVatClassName}
      />
    </>
  );
}

function PacketaPointField({
  control,
  isSubmitting,
}: {
  control: Control<OrderFormValues>;
  isSubmitting: boolean;
}) {
  return (
    <Controller
      name="packetaPoint"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <PacketaPicker
            value={field.value}
            onChange={field.onChange}
            disabled={isSubmitting}
            layout="embedded"
          />

          {fieldState.error ? (
            <FieldError errors={[fieldState.error]} />
          ) : null}
        </Field>
      )}
    />
  );
}

type DeliveryOptionCardProps = {
  id: string;
  option: typeof pickupOption | typeof packetaOption;
  isSelected: boolean;
  showRadio: boolean;
  invalid?: boolean;
  children?: ReactNode;
};

function DeliveryOptionCard({
  id,
  option,
  isSelected,
  showRadio,
  invalid,
  children,
}: DeliveryOptionCardProps) {
  return (
    <label
      htmlFor={showRadio ? id : undefined}
      data-selected={isSelected ? "true" : "false"}
      className={cn(
        orderFormOptionCardClassName,
        !showRadio && "cursor-default hover:border-[#EAD6DE] hover:bg-[#FFF7F4]/40",
        children ? "grid-rows-[auto_auto]" : undefined,
      )}
    >
      {showRadio ? (
        <RadioGroupItem
          id={id}
          value={option.value}
          aria-invalid={invalid}
          className={cn(
            orderFormRadioClassName,
            "col-start-1 row-start-1 self-start mt-2",
          )}
        />
      ) : null}

      <div
        className={cn(
          "col-start-2 row-start-1 flex min-w-0 items-start gap-2.5",
          !showRadio && "col-span-2",
        )}
      >
        <DeliveryOptionHeader {...option} />
      </div>

      {children ? (
        <div
          className="col-span-2 row-start-2 border-t border-[#EAD6DE]/70 pt-2.5"
          onClick={(event) => {
            event.stopPropagation();
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
        >
          {children}
        </div>
      ) : null}
    </label>
  );
}

export function FormDeliveryMethod({
  control,
  showPickup = false,
  isSubmitting = false,
}: DeliveryMethodFieldProps) {
  const deliveryOptions = showPickup
    ? [pickupOption, packetaOption]
    : [packetaOption];

  return (
    <Controller
      name="deliveryMethod"
      control={control}
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid} className="gap-3">
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            aria-invalid={fieldState.invalid}
            className={cn(
              "grid gap-3",
              deliveryOptions.length > 1 ? "sm:grid-cols-2" : "max-w-lg",
            )}
          >
            {deliveryOptions.map((option) => {
              const id = `delivery-method-${option.value}`;
              const isSelected = field.value === option.value;
              const showPacketaPicker =
                option.value === "packeta" && isSelected;

              return (
                <DeliveryOptionCard
                  key={option.value}
                  id={id}
                  option={option}
                  isSelected={isSelected}
                  showRadio
                  invalid={fieldState.invalid}
                >
                  {showPacketaPicker ? (
                    <PacketaPointField
                      control={control}
                      isSubmitting={isSubmitting}
                    />
                  ) : null}
                </DeliveryOptionCard>
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
