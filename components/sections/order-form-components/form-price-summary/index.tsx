import {
  calendarTypes,
  getCalendarPrice,
  type CalendarTypes,
  type QuantityOption,
} from "@/app/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceWithVat } from "@/components/ui/price-with-vat";
import { DeliveryWaveNotice } from "@/components/ui/delivery-wave-notice";
import { Heading, SectionLabel } from "@/components/ui/typography";
import { getDeliveryLabel, getDeliveryPrice } from "@/helpers/delivery";
import { getDiscountAmount } from "@/helpers/discount-codes";
import {
  ORDER_HANGING_SET_LABEL,
  ORDER_HANGING_SET_SUMMARY_ITEMS,
} from "@/lib/order/config";
import { cn } from "@/lib/utils";
import {
  orderFormPriceTotalClassName,
  orderFormPriceTotalVatClassName,
} from "../order-form-styles";
import { Check, Tag, X } from "lucide-react";
import type { ReactNode } from "react";

type DeliveryMethod = "pickup" | "packeta";

type PriceSummaryProps = {
  type: CalendarTypes;
  quantityOption: QuantityOption;
  customQuantity?: number;
  selectedPhotosQuantity?: number;
  deliveryMethod?: DeliveryMethod;
  onQuantityChange?: (quantity: 3 | 5) => void;
  discountCode?: string;
  discountCodeError?: string;
  discountCodeTouched?: boolean;
  onDiscountCodeChange?: (value: string) => void;
  onDiscountCodeApply?: () => void;
  onDiscountCodeClear?: () => void;
};

export function PriceSummary({
  type,
  quantityOption,
  customQuantity,
  selectedPhotosQuantity,
  deliveryMethod = "pickup",
  onQuantityChange,
  discountCode = "",
  discountCodeError,
  onDiscountCodeChange,
  onDiscountCodeClear,
  discountCodeTouched = false,
  onDiscountCodeApply,
}: PriceSummaryProps) {
  // ── business logic (unchanged) ──────────────────────────────────────────
  const price = getCalendarPrice({ type, quantityOption, customQuantity });
  const selectedType = calendarTypes.find((item) => item.value === type);

  const quantity = price.quantity;
  const originalTotalPrice = price.totalPrice;
  const originalPricePerPiece = price.pricePerPiece;
  const savedAmount = price.savedAmount;

  const discount = getDiscountAmount(originalTotalPrice, discountCode);
  const deliveryPrice = getDeliveryPrice(deliveryMethod);
  const deliveryLabel = getDeliveryLabel(deliveryMethod);

  const hasAppliedDiscount =
    discount.isValid &&
    discount.discountAmount > 0 &&
    discount.finalPrice !== null;

  const productPriceAfterDiscount = discount.finalPrice;

  const totalPrice =
    productPriceAfterDiscount !== null
      ? productPriceAfterDiscount + deliveryPrice
      : null;

  const productPricePerPiece =
    productPriceAfterDiscount !== null && quantity !== null
      ? productPriceAfterDiscount / quantity
      : null;

  const hasFixedPrice = totalPrice !== null;
  const hasQuantity = quantity !== null;

  const singlePiecePrice = selectedType?.prices[1] ?? null;
  const computedTotalPrice =
    quantity !== null && singlePiecePrice !== null
      ? singlePiecePrice * quantity
      : null;

  const hasSavings = savedAmount !== null && savedAmount > 0;
  const hasDiscountCode = discountCode.trim().length > 0;

  // ── derived display values ──────────────────────────────────────────────
  const displayTotal = hasFixedPrice
    ? totalPrice
    : originalTotalPrice !== null
      ? originalTotalPrice + deliveryPrice
      : computedTotalPrice !== null
        ? computedTotalPrice + deliveryPrice
        : null;

  //  Show breakdown list only when there are actual savings/discounts to itemise
  const hasDeliveryPrice = deliveryPrice > 0;
  const showBreakdown = hasSavings || hasAppliedDiscount || hasDeliveryPrice;

  //  The "before all discounts" reference price used in the breakdown
  const referencePrice = computedTotalPrice ?? originalTotalPrice;

  // ── summary rows ────────────────────────────────────────────────────────
  const summaryItems: Array<{ label: string; value: ReactNode }> = [
    { label: "Produkt", value: "A3 nástenný kalendár" },
    { label: "Variant", value: selectedType?.label ?? "—" },
    { label: "Počet kusov", value: hasQuantity ? `${quantity} ks` : "—" },
    {
      label: "Počet nahraných fotiek",
      value: `${selectedPhotosQuantity ?? 0}`,
    },
  ];

  return (
    <>
      {/* ── Header ── */}
      <div className="border-b border-[#EAD6DE] bg-[#FFF7F4] px-4 py-4 sm:px-5">
        <SectionLabel>Súhrn</SectionLabel>
        <Heading as="h3" className="mt-1 text-xl sm:text-2xl">
          Vaša objednávka
        </Heading>
      </div>

      {/* ── Order details ── */}
      <div className="px-4 py-4 sm:px-5">
        <DeliveryWaveNotice variant="compact" className="mb-4" />

        <div className="space-y-2">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span className="min-w-0 shrink font-medium text-[#3E0F28]/55">
                {item.label}
              </span>
              <span className="max-w-[58%] shrink-0 text-right font-bold break-words text-[#3E0F28]">
                {item.value}
              </span>
            </div>
          ))}

          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0 shrink font-medium text-[#3E0F28]/55">
              Doručenie
            </span>
            <span className="max-w-[58%] shrink-0 text-right font-bold text-[#3E0F28]">
              {deliveryPrice > 0 ? (
                <span className="inline-flex flex-col items-end gap-0.5">
                  <span>{deliveryLabel}</span>
                  <PriceWithVat
                    value={deliveryPrice}
                    className="justify-end text-sm font-bold"
                    vatClassName="text-[10px] font-medium text-primary/40"
                  />
                </span>
              ) : (
                deliveryLabel
              )}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[#EAD6DE] bg-[#FFF7F4]/80 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#3E0F28]/50">
            V balení
          </p>
          <p className="mt-1 text-sm font-bold text-[#3E0F28]">
            {ORDER_HANGING_SET_LABEL}
          </p>
          <ul className="mt-2 space-y-1">
            {ORDER_HANGING_SET_SUMMARY_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs font-medium leading-5 text-[#3E0F28]/75 sm:text-sm"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-[#FC5A61]"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Price section ── */}
      <div className="space-y-3 border-t border-[#EAD6DE] bg-[#FFF7F4]/50 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        {/* Price breakdown OR simple total */}
        {showBreakdown ? (
          /* When there are savings / discounts → show a clean breakdown list */
          <div className="space-y-2 rounded-xl border border-border bg-white px-3 py-2.5 sm:px-4 sm:py-3">
            {/* Reference price (before any discounts) */}
            {referencePrice !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-primary/50 font-medium">
                  Pôvodná cena
                </span>
                <span className="whitespace-nowrap text-primary/50 font-medium">
                <PriceWithVat
                  value={referencePrice}
                  className="justify-end text-sm font-medium text-primary/50"
                  amountClassName="text-primary/50"
                  vatClassName="text-[10px] font-medium text-primary/35"
                />
                </span>
              </div>
            )}

            {/* Quantity / bulk savings */}
            {hasSavings && savedAmount !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700 font-medium">
                  Množstevná zľava
                </span>
                <span className="whitespace-nowrap text-emerald-700 font-semibold">
                  <PriceWithVat
                    value={savedAmount}
                    sign="−"
                    className="justify-end text-sm font-semibold text-emerald-700"
                    amountClassName="text-emerald-700"
                    vatClassName="text-[10px] font-medium text-emerald-600/70"
                  />
                </span>
              </div>
            )}

            {/* Coupon discount */}
            {hasAppliedDiscount && (
              <div className="flex justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                  <Tag className="size-3.5" />
                  Kód {discount.code}
                </span>
                <span className="whitespace-nowrap text-emerald-700 font-semibold">
                  <PriceWithVat
                    value={discount.discountAmount}
                    sign="−"
                    className="justify-end text-sm font-semibold text-emerald-700"
                    amountClassName="text-emerald-700"
                    vatClassName="text-[10px] font-medium text-emerald-600/70"
                  />
                </span>
              </div>
            )}

            {/* Delivery */}
            {hasDeliveryPrice && (
              <div className="flex justify-between text-sm">
                <span className="text-primary/50 font-medium">
                  {deliveryLabel}
                </span>
                <span className="whitespace-nowrap text-primary/70 font-semibold">
                  <PriceWithVat
                    value={deliveryPrice}
                    sign="+"
                    className="justify-end text-sm font-semibold text-primary/70"
                    amountClassName="text-primary/70"
                    vatClassName="text-[10px] font-medium text-primary/40"
                  />
                </span>
              </div>
            )}

            {/* Final total */}
            <div className="border-t border-border/50 pt-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className={cn(orderFormPriceTotalClassName, "text-lg font-semibold")}>
                  Spolu
                </span>
                <span className={cn("whitespace-nowrap leading-none", orderFormPriceTotalClassName)}>
                {displayTotal !== null ? (
                  <PriceWithVat
                    value={displayTotal}
                    className={cn("justify-end", orderFormPriceTotalClassName)}
                    vatClassName={orderFormPriceTotalVatClassName}
                  />
                ) : (
                  "—"
                )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* When there are no discounts → simple, large total */
          <div className="flex items-end justify-between gap-4 pt-2">
            <p className={cn(orderFormPriceTotalClassName, "font-semibold")}>
              Spolu
            </p>
            <div className="text-right">
              <p className={cn("leading-none", orderFormPriceTotalClassName)}>
                {displayTotal !== null ? (
                  <PriceWithVat
                    value={displayTotal}
                    className={cn("justify-end", orderFormPriceTotalClassName)}
                    vatClassName={orderFormPriceTotalVatClassName}
                  />
                ) : computedTotalPrice !== null ? (
                  <PriceWithVat
                    value={computedTotalPrice}
                    className={cn("justify-end", orderFormPriceTotalClassName)}
                    vatClassName={orderFormPriceTotalVatClassName}
                  />
                ) : (
                  "—"
                )}
              </p>

              {displayTotal === null && computedTotalPrice === null && (
                <p className="mt-1 max-w-48 text-xs leading-5 text-secondary/70">
                  Cenu potvrdím individuálne podľa množstva a úprav.
                </p>
              )}

            </div>
          </div>
        )}

        {/* ── Discount code ── */}
        {onDiscountCodeChange && (
          <div>
            {hasAppliedDiscount ? (
              /* Applied state: green chip */
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="size-3.5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Kód {discount.code}
                    </p>
                    <p className="text-xs font-medium text-emerald-600">
                      Zľava{" "}
                      <PriceWithVat
                        value={discount.discountAmount}
                        sign="−"
                        className="inline-flex text-xs font-medium text-emerald-600"
                        amountClassName="text-emerald-600"
                        vatClassName="text-[10px] font-medium text-emerald-600/70"
                      />
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onDiscountCodeClear}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700/50 transition hover:text-emerald-900 hover:cursor-pointer p-2"
                >
                  <X className="size-3.5" />
                  Odstrániť
                </button>
              </div>
            ) : (
              /* Input state */
              <div>
                <label
                  htmlFor="discountCode"
                  className="text-sm font-bold text-primary"
                >
                  Zľavový kód
                </label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="discountCode"
                    value={discountCode}
                    onChange={(e) =>
                      onDiscountCodeChange(e.target.value.toUpperCase())
                    }
                    placeholder="Zadajte kód"
                    autoComplete="off"
                    className="h-10 flex-1 uppercase"
                    aria-invalid={Boolean(
                      discountCodeTouched && discountCodeError,
                    )}
                  />
                  {onDiscountCodeApply && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onDiscountCodeApply}
                      size="sm"
                      className="h-10 px-4"
                      disabled={!hasDiscountCode}
                    >
                      Použiť
                    </Button>
                  )}
                </div>
                {discountCodeTouched && discountCodeError && (
                  <p className="mt-1.5 text-xs font-semibold text-destructive">
                    {discountCodeError}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Upsell banner (quantity = 1) ── */}
        {hasFixedPrice && quantity === 1 && onQuantityChange && (
          <div className="rounded-md border border-[#EAD6DE] bg-white px-3 py-2 shadow-sm">
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
