import {
  calendarTypes,
  getCalendarPrice,
  type CalendarTypes,
  type QuantityOption,
} from "@/app/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading, Text } from "@/components/ui/typography";
import { getDiscountAmount } from "@/helpers/discount-codes";
import { Tag } from "lucide-react";

type PriceSummaryProps = {
  type: CalendarTypes;
  quantityOption: QuantityOption;
  customQuantity?: number;
  selectedPhotosQuantity?: number;
  onQuantityChange?: (quantity: 3 | 5) => void;
  discountCode?: string;
  discountCodeError?: string;
  discountCodeTouched?: boolean;
  onDiscountCodeChange?: (value: string) => void;
  onDiscountCodeApply?: () => void;
  onDiscountCodeClear?: () => void;
};

function formatPrice(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export function PriceSummary({
  type,
  quantityOption,
  customQuantity,
  selectedPhotosQuantity,
  onQuantityChange,
  discountCode = "",
  discountCodeError,
  onDiscountCodeChange,
  onDiscountCodeClear,
  discountCodeTouched = false,
  onDiscountCodeApply,
}: PriceSummaryProps) {
  const price = getCalendarPrice({
    type,
    quantityOption,
    customQuantity,
  });

  const selectedType = calendarTypes.find((item) => item.value === type);

  const quantity = price.quantity;
  const originalTotalPrice = price.totalPrice;
  const originalPricePerPiece = price.pricePerPiece;

  const discount = getDiscountAmount(originalTotalPrice, discountCode);

  const hasAppliedDiscount =
    discount.isValid &&
    discount.discountAmount > 0 &&
    discount.finalPrice !== null;

  const totalPrice = discount.finalPrice;
  const pricePerPiece =
    totalPrice !== null && quantity !== null ? totalPrice / quantity : null;

  const hasFixedPrice = totalPrice !== null;
  const hasQuantity = quantity !== null;
  const showPricePerPiece =
    pricePerPiece !== null && quantity !== null && quantity > 1;

  const singlePiecePrice = selectedType?.prices[1] ?? null;

  const showDiscountedUnitPrice =
    !hasAppliedDiscount &&
    originalPricePerPiece !== null &&
    quantity !== null &&
    quantity > 1 &&
    singlePiecePrice !== null &&
    originalPricePerPiece < singlePiecePrice;

  const computedTotalPrice =
    quantity !== null && singlePiecePrice !== null
      ? singlePiecePrice * quantity
      : null;

  const savedAmount = price.savedAmount;
  const hasSavings = savedAmount !== null && savedAmount > 0;

  const summaryItems = [
    {
      label: "Produkt",
      value: "A3 nástenný kalendár",
    },
    {
      label: "Variant",
      value: selectedType?.label ?? "—",
    },
    {
      label: "Počet kusov",
      value: hasQuantity ? `${quantity} ks` : "—",
    },
    {
      label: "Počet nahraných fotiek",
      value: `${selectedPhotosQuantity ?? 0}`,
    },
  ];

  const hasDiscountCode = discountCode.trim().length > 0;
  const isDiscountCodeValid = hasDiscountCode && hasAppliedDiscount;
  const isDiscountCodeInvalid = hasDiscountCode && Boolean(discountCodeError);

  return (
    <>
      <div className="bg-[#FFF7F4] px-5 py-5 text-center border-b border-[#EAD6DE]">
        <Text variant="caption" as="span" className="text-xs">
          Súhrn objednávky
        </Text>

        <Heading as="h3" className="mt-2 ">
          Váš kalendár
        </Heading>
      </div>

      <div className="px-5 py-2">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-4 border-b border-border py-1.5 last:border-b-0"
          >
            <span className="text-md text-primary">{item.label}</span>
            <span className="text-md text-right font-bold text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-surface-soft px-5 py-1">
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-heading text-4xl font-semibold text-secondary">
              Spolu
            </p>

            {!hasFixedPrice && (
              <p className="mt-1 max-w-48 text-xs leading-5 text-secondary">
                Cenu potvrdím individuálne podľa množstva a úprav.
              </p>
            )}
          </div>

          <div className="text-right">
            {hasAppliedDiscount && originalTotalPrice !== null && (
              <p className="font-heading text-lg font-semibold leading-none text-secondary/60 line-through">
                {formatPrice(originalTotalPrice)} €
              </p>
            )}

            <p className="font-heading text-4xl font-bold leading-none text-secondary">
              {hasFixedPrice
                ? `${formatPrice(totalPrice)} €`
                : computedTotalPrice !== null
                  ? `${formatPrice(computedTotalPrice)} €`
                  : "—"}
            </p>
          </div>
        </div>

        {showPricePerPiece && (
          <div className="mt-2 space-y-2 rounded-lg bg-white/80 px-1 py-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-primary/70">
                Cena za 1 kalendár
              </span>

              <div className="flex items-center gap-2 text-right">
                {hasAppliedDiscount && originalPricePerPiece !== null ? (
                  <p className="font-heading text-sm font-semibold text-primary/70 line-through">
                    {formatPrice(originalPricePerPiece)} €
                  </p>
                ) : (
                  showDiscountedUnitPrice &&
                  singlePiecePrice !== null && (
                    <p className="font-heading text-sm font-semibold text-primary/70 line-through">
                      {formatPrice(singlePiecePrice)} €
                    </p>
                  )
                )}

                <p className="font-heading text-md font-semibold text-primary">
                  {pricePerPiece !== null ? formatPrice(pricePerPiece) : "—"} €
                </p>
              </div>
            </div>

            {hasSavings && (
              <div className="mt-1 border-t border-border pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-primary/70">
                    Ušetril si
                  </span>

                  <span className="font-heading text-md font-semibold text-primary">
                    {formatPrice(savedAmount)} €
                  </span>
                </div>
              </div>
            )}

            {hasAppliedDiscount && (
              <div className="mt-1 border-t border-border pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary/70">
                    <Tag className="size-3.5" />
                    Zľavový kód
                  </span>

                  <span className="font-heading text-md font-semibold text-primary">
                    -{formatPrice(discount.discountAmount)} €
                  </span>
                </div>
              </div>
            )}

            {onDiscountCodeChange && (
              <div className="py-1">
                {!hasAppliedDiscount && (
                  <label
                    htmlFor="discountCode"
                    className="text-sm font-bold text-primary"
                  >
                    Zľavový kód
                  </label>
                )}

                <div className="mt-2 flex gap-2">
                  <Input
                    id="discountCode"
                    value={discountCode}
                    onChange={(event) =>
                      onDiscountCodeChange(event.target.value.toUpperCase())
                    }
                    placeholder="Zadajte kód"
                    autoComplete="off"
                    className="h-10 flex-1 uppercase"
                    aria-invalid={Boolean(
                      discountCodeTouched && discountCodeError,
                    )}
                  />
                </div>

                {discountCodeTouched && discountCodeError && (
                  <p className="mt-2 text-xs font-semibold text-destructive">
                    {discountCodeError}
                  </p>
                )}

                {hasAppliedDiscount && (
                  <div className="mt-3 flex items-center justify-between gap-3 py-1 text-sm">
                    <div>
                      <p className="font-bold text-primary">
                        Kód {discount.code} bol použitý
                      </p>
                      <p className="text-xs font-medium text-primary/55">
                        Zľava -{formatPrice(discount.discountAmount)} €
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onDiscountCodeClear}
                      className="text-xs font-bold text-primary/55 transition hover:text-primary"
                    >
                      Odstrániť
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {hasFixedPrice && quantity === 1 && onQuantityChange && (
          <div className="mt-6 rounded-md border border-[#EAD6DE] bg-white px-3 py-2 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-lime text-sm font-extrabold text-primary">
                %
              </div>

              <div className="mt-2 min-w-0 flex-1">
                <p className="text-sm font-bold text-[#3E0F28]">
                  Objednaj viac a ušetri
                </p>

                <p className="mt-1 text-sm font-medium leading-5 text-primary/60">
                  až 10€ na 1 kalendári
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onQuantityChange(3)}
                    size="sm"
                  >
                    Chcem 3 ks
                  </Button>

                  <Button
                    type="button"
                    onClick={() => onQuantityChange(5)}
                    variant="lime"
                    size="sm"
                  >
                    Chcem 5 ks
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
