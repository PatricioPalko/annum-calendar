import {
  calendarTypes,
  getCalendarPrice,
  type CalendarTypes,
  type QuantityOption,
} from "@/app/types/types";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";

type PriceSummaryProps = {
  type: CalendarTypes;
  quantityOption: QuantityOption;
  customQuantity?: number;
  selectedPhotosQuantity?: number;
  onQuantityChange?: (quantity: 3 | 5) => void;
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
}: PriceSummaryProps) {
  const price = getCalendarPrice({
    type,
    quantityOption,
    customQuantity,
  });

  const selectedType = calendarTypes.find((item) => item.value === type);

  const quantity = price.quantity;
  const totalPrice = price.totalPrice;
  const pricePerPiece = price.pricePerPiece;

  const hasFixedPrice = totalPrice !== null;
  const hasQuantity = quantity !== null;
  const showPricePerPiece =
    pricePerPiece !== null && quantity !== null && quantity > 1;

  const singlePiecePrice = selectedType?.prices[1] ?? null;

  const showDiscountedUnitPrice =
    pricePerPiece !== null &&
    quantity !== null &&
    quantity > 1 &&
    singlePiecePrice !== null &&
    pricePerPiece < singlePiecePrice;

  const computedTotalPrice =
    showDiscountedUnitPrice !== null &&
    quantity !== null &&
    singlePiecePrice !== null
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
      value: `${selectedPhotosQuantity}`,
    },
  ];

  return (
    <aside className="overflow-hidden rounded-lg border border-soft bg-white shadow-xl shadow-primary/5">
      <div className="border-b border-border px-5 py-5 text-center">
        <Text variant="caption" as="span" className="text-xs">
          Súhrn objednávky
        </Text>

        <Heading
          as="h3"
          className="mt-2 font-heading text-2xl font-bold text-foreground"
        >
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
            <span className="text-right text-md font-bold text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-surface-soft px-5 py-3">
        <div className="flex items-end justify-between gap-4 mt-8">
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

          <p className="font-heading text-4xl font-bold leading-none text-secondary">
            {hasFixedPrice
              ? `${totalPrice} €`
              : `${computedTotalPrice !== null ? `${computedTotalPrice} €` : "—"}`}
          </p>
        </div>
        {showPricePerPiece && (
          <div className="mt-4 rounded-md border border-border bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-primary">
                Cena za 1 kalendár
              </span>

              <div className="flex items-center gap-2 text-right">
                {showDiscountedUnitPrice && singlePiecePrice !== null && (
                  <p className="font-heading text-sm font-semibold text-primary/70 line-through">
                    {formatPrice(singlePiecePrice)} €
                  </p>
                )}

                <p className="font-heading text-md font-semibold text-primary">
                  {formatPrice(pricePerPiece)} €
                </p>
              </div>
            </div>

            {hasSavings && (
              <div className="mt-1 border-t border-border pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-primary">
                    Ušetril si
                  </span>

                  <span className="font-heading text-md font-semibold text-primary">
                    {formatPrice(savedAmount)} €
                  </span>
                </div>
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

              <div className="min-w-0 flex-1 mt-2">
                <p className="text-sm font-bold text-[#3E0F28]">
                  Objednaj viac a ušetri
                </p>

                <p className="mt-1 text-sm leading-5 font-medium text-primary/60">
                  až 10€ na 1 kalendári
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => onQuantityChange(3)}
                    size="sm"
                  >
                    Chcem 3 ks
                  </Button>

                  <Button
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

      <div className="border-t border-border px-5 py-4">
        <p className="text-xs leading-5 text-secondary tracking-wide">
          Cena zahŕňa spracovanie podkladov, prípravu kalendára a tlač podľa
          zvoleného variantu.
        </p>
      </div>
    </aside>
  );
}
