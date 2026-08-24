import { Control, Controller, useWatch } from "react-hook-form";

import {
  calendarTypes,
  CUSTOM_QUANTITY_VALUE,
  getCalendarPrice,
  type FixedPriceQuantity,
  quantityItems,
} from "@/app/types/types";
import { Field, FieldError } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PriceWithVat } from "@/components/ui/price-with-vat";
import {
  orderFormRecommendedBadgeClassName,
  recommendedBadgeLabel,
  RecommendedBadge,
} from "@/components/ui/recommended-badge";
import { formatEuroPrice } from "@/helpers/format-euro-price";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { FormNumberInput } from "../form-number-input";
import {
  orderFormPriceClassName,
  orderFormPriceVatClassName,
  orderFormQuantityCardBodyClassName,
  orderFormQuantityCardClassName,
  orderFormQuantityCardFooterClassName,
  orderFormQuantityCardHeaderClassName,
  orderFormRadioClassName,
} from "../order-form-styles";

type QuantityFieldProps = {
  control: Control<OrderFormValues>;
  name: "quantityOption";
  selectedCalendarType: OrderFormValues["types"];
};

type QuantityPriceLineProps = {
  singlePiecePrice: number | null;
  pricePerPiece: number;
  totalPrice: number;
  hasDiscount: boolean;
};

function QuantityPriceLine({
  singlePiecePrice,
  pricePerPiece,
  totalPrice,
  hasDiscount,
}: QuantityPriceLineProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        {hasDiscount && singlePiecePrice !== null ? (
          <span className="text-sm font-semibold text-[#3E0F28]/45 line-through">
            {formatEuroPrice(singlePiecePrice)}/ks
          </span>
        ) : null}

        <PriceWithVat
          value={pricePerPiece}
          perUnit
          className={orderFormPriceClassName}
          vatClassName={orderFormPriceVatClassName}
        />
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-[#3E0F28]/55">Spolu</span>
        <PriceWithVat
          value={totalPrice}
          className={orderFormPriceClassName}
          vatClassName={orderFormPriceVatClassName}
        />
      </div>
    </div>
  );
}

export function FormQuantity({
  control,
  name,
  selectedCalendarType,
}: QuantityFieldProps) {
  const selectedPlan = calendarTypes.find(
    (plan) => plan.value === selectedCalendarType,
  );

  const customQuantity = useWatch({ control, name: "customQuantity" });
  const singlePiecePrice = selectedPlan?.prices[1] ?? null;

  const customPrice =
    customQuantity !== undefined && customQuantity >= 1
      ? getCalendarPrice({
          type: selectedCalendarType,
          quantityOption: CUSTOM_QUANTITY_VALUE,
          customQuantity,
        })
      : null;

  const customHasDiscount =
    singlePiecePrice !== null &&
    customPrice !== null &&
    customPrice.pricePerPiece !== null &&
    customPrice.quantity !== null &&
    customPrice.quantity > 1 &&
    customPrice.pricePerPiece < singlePiecePrice;

  const showCustomPrice =
    customPrice !== null &&
    customPrice.totalPrice !== null &&
    customPrice.pricePerPiece !== null;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <RadioGroup
            value={String(field.value)}
            onValueChange={(value) => {
              field.onChange(Number(value));
            }}
            className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {quantityItems.map((item) => {
              const isCustom = item.value === CUSTOM_QUANTITY_VALUE;
              const isPresetQuantity = !isCustom;
              const isSelected = field.value === item.value;
              const radioId = `quantity-option-${item.value}`;

              const totalPrice =
                isPresetQuantity && selectedPlan
                  ? selectedPlan.prices[item.value as FixedPriceQuantity]
                  : undefined;

              const pricePerPiece =
                totalPrice && isPresetQuantity
                  ? totalPrice / item.value
                  : undefined;

              const hasDiscount =
                singlePiecePrice !== null &&
                pricePerPiece !== undefined &&
                item.value > 1 &&
                pricePerPiece < singlePiecePrice;

              const isRecommended = item.value === 3;

              return (
                <label
                  key={item.value}
                  htmlFor={radioId}
                  data-selected={isSelected ? "true" : "false"}
                  className={cn(
                    orderFormQuantityCardClassName,
                    "pt-5",
                  )}
                >
                  {isCustom ? (
                    <RecommendedBadge
                      className={cn(
                        orderFormRecommendedBadgeClassName,
                        "bg-[#FFF7F4] text-[#3E0F28] ring-1 ring-[#EAD6DE]",
                      )}
                    >
                      Vlastný počet
                    </RecommendedBadge>
                  ) : isRecommended ? (
                    <RecommendedBadge
                      variant="lime"
                      className={orderFormRecommendedBadgeClassName}
                    >
                      {recommendedBadgeLabel}
                    </RecommendedBadge>
                  ) : null}

                  <div
                    className={cn(
                      orderFormQuantityCardHeaderClassName,
                      isCustom && "pb-2",
                    )}
                  >
                    <RadioGroupItem
                      id={radioId}
                      value={String(item.value)}
                      className={orderFormRadioClassName}
                    />

                    <div className={orderFormQuantityCardBodyClassName}>
                      {!isCustom ? (
                        <p className="text-base font-bold leading-tight text-foreground">
                          {item.label}
                        </p>
                      ) : (
                        <FormNumberInput control={control} layout="card" />
                      )}
                    </div>
                  </div>

                  <div className={orderFormQuantityCardFooterClassName}>
                    {isCustom ? (
                      showCustomPrice &&
                      customPrice.pricePerPiece !== null &&
                      customPrice.totalPrice !== null ? (
                        <QuantityPriceLine
                          singlePiecePrice={singlePiecePrice}
                          pricePerPiece={customPrice.pricePerPiece}
                          totalPrice={customPrice.totalPrice}
                          hasDiscount={customHasDiscount}
                        />
                      ) : null
                    ) : (
                      pricePerPiece !== undefined &&
                      totalPrice !== undefined && (
                        <QuantityPriceLine
                          singlePiecePrice={singlePiecePrice}
                          pricePerPiece={pricePerPiece}
                          totalPrice={totalPrice}
                          hasDiscount={hasDiscount}
                        />
                      )
                    )}
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
