import { formatPrice } from "@/helpers/admin-order-price";

type AdminOrdersSummaryProps = {
  ordersCount: number;
  paidCount: number;
  pendingPaymentCount: number;
  totalQuantity: number;
  totalPrice: number;
  paidTotalPrice: number;
  totalOriginalPrice: number;
  totalDiscountAmount: number;
  customPriceCount: number;
};

export function AdminOrdersSummary({
  ordersCount,
  paidCount,
  pendingPaymentCount,
  totalQuantity,
  totalPrice,
  paidTotalPrice,
  totalOriginalPrice,
  totalDiscountAmount,
  customPriceCount,
}: AdminOrdersSummaryProps) {
  return (
    <div className="mt-12 border-t border-[#EAD6DE] bg-white shadow-lg shadow-[#3E0F28]/5">
      <div className="grid md:grid-cols-4">
        <div className="p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FC5A61]">
            Objednávky
          </p>

          <p className="mt-2 text-2xl font-bold text-[#3E0F28]">
            {ordersCount}
          </p>

          <p className="mt-1 text-sm font-medium text-[#3E0F28]/60">
            Celkový počet objednávok
          </p>
        </div>

        <div className="border-t border-[#EAD6DE] p-5 md:border-l md:border-t-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FC5A61]">
            Platby
          </p>

          <p className="mt-2 text-2xl font-bold text-[#3E0F28]">
            {paidCount} / {ordersCount}
          </p>

          <div className="mt-1 space-y-0.5 text-sm font-medium text-[#3E0F28]/60">
            <p>Zaplatené {paidCount}</p>

            {pendingPaymentCount > 0 && <p>Čaká {pendingPaymentCount}</p>}
          </div>
        </div>

        <div className="border-t border-[#EAD6DE] p-5 md:border-l md:border-t-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FC5A61]">
            Kusy
          </p>

          <p className="mt-2 text-2xl font-bold text-[#3E0F28]">
            {totalQuantity} ks
          </p>

          <p className="mt-1 text-sm font-medium text-[#3E0F28]/60">
            Celkový počet kalendárov
          </p>
        </div>

        <div className="border-t border-[#EAD6DE] p-5 md:border-l md:border-t-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FC5A61]">
            Tržba
          </p>

          <div className="mt-2 flex items-baseline gap-2">
            {totalDiscountAmount > 0 && (
              <span className="text-sm font-bold text-[#3E0F28]/40 line-through">
                {formatPrice(totalOriginalPrice)}
              </span>
            )}

            <span className="text-2xl font-bold text-[#3E0F28]">
              {formatPrice(totalPrice)}
            </span>
          </div>

          <div className="mt-1 space-y-0.5 text-sm font-medium text-[#3E0F28]/60">
            <p>Zaplatené {formatPrice(paidTotalPrice)}</p>

            {totalDiscountAmount > 0 && (
              <p>Zľavy {formatPrice(totalDiscountAmount)}</p>
            )}

            {customPriceCount > 0 && <p>{customPriceCount} na mieru</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
