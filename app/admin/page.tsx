import { AdminBulkDownloadButton } from "@/components/admin/admin-bulk-download-button";
import { AdminOrdersSummary } from "@/components/admin/orders/admin-orders-summary";
import { AdminOrdersTable } from "@/components/admin/orders/admin-orders-table";
import { getOrderDiscountAmount } from "@/helpers/admin-orders";
import { sortOrders } from "@/helpers/admin-table";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

import { AdminMarkDownloadedCompletedButton } from "@/components/admin/admin-mark-downloaded-completed-button";
import { OrderRow, SearchParams, SortKey } from "../types/types";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin objednávky",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;

  const currentSort: SortKey = params.sort ?? "created_at";
  const currentDir: "asc" | "desc" = params.dir ?? "desc";

  const { data, error } = await supabaseAdmin.from("orders").select("*");

  if (error) {
    throw new Error(error.message);
  }

  const orders = sortOrders(
    (data ?? []) as OrderRow[],
    currentSort,
    currentDir,
  );

  const undownloadedCount = orders.filter(
    (order) => !order.downloaded_at,
  ).length;

  const paidCount = orders.filter(
    (order) => order.payment_status === "paid",
  ).length;

  const pendingPaymentCount = orders.filter(
    (order) => order.payment_status !== "paid",
  ).length;

  const totalQuantity = orders.reduce(
    (sum, order) => sum + Number(order.quantity ?? 0),
    0,
  );

  const totalPrice = orders.reduce((sum, order) => {
    if (order.total_price === null || order.total_price === undefined) {
      return sum;
    }

    return sum + Number(order.total_price);
  }, 0);

  const paidTotalPrice = orders.reduce((sum, order) => {
    if (
      order.payment_status !== "paid" ||
      order.total_price === null ||
      order.total_price === undefined
    ) {
      return sum;
    }

    return sum + Number(order.total_price);
  }, 0);

  const totalDiscountAmount = orders.reduce((sum, order) => {
    return sum + getOrderDiscountAmount(order);
  }, 0);

  const totalOriginalPrice = totalPrice + totalDiscountAmount;

  const customPriceCount = orders.filter(
    (order) => order.total_price === null || order.total_price === undefined,
  ).length;

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#FFF7F4] px-4 py-8 sm:px-6 sm:py-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]">
              Admin
            </p>

            <h1 className="mt-2 font-heading text-2xl font-bold text-[#3E0F28] sm:text-4xl">
              Objednávky
            </h1>

            <p className="mt-2 break-words text-sm font-medium text-[#3E0F28]/60">
              Spolu {orders.length} objednávok · nestiahnuté {undownloadedCount}{" "}
              · zaplatené {paidCount}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <AdminBulkDownloadButton disabled={undownloadedCount === 0} />
            <AdminMarkDownloadedCompletedButton />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#EAD6DE] bg-white shadow-xl shadow-[#3E0F28]/10">
          <AdminOrdersTable
              orders={orders}
              currentSort={currentSort}
              currentDir={currentDir}
            />
          <AdminOrdersSummary
            ordersCount={orders.length}
            paidCount={paidCount}
            pendingPaymentCount={pendingPaymentCount}
            totalQuantity={totalQuantity}
            totalPrice={totalPrice}
            paidTotalPrice={paidTotalPrice}
            totalOriginalPrice={totalOriginalPrice}
            totalDiscountAmount={totalDiscountAmount}
            customPriceCount={customPriceCount}
          />
        </div>
      </div>
    </main>
  );
}
