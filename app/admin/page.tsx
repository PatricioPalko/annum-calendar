import { AdminOrdersFilterPersistence } from "@/components/admin/orders/admin-orders-filter-persistence";
import { AdminOrdersFilters } from "@/components/admin/orders/admin-orders-filters";
import { AdminOrdersSummary } from "@/components/admin/orders/admin-orders-summary";
import { AdminOrdersTable } from "@/components/admin/orders/admin-orders-table";
import { getOrderDiscountAmount } from "@/helpers/admin-orders";
import {
  filterAdminOrders,
  getAvailableYears,
  sortOrders,
} from "@/helpers/admin-table";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

import { OrderRow, SearchParams, SortKey } from "../types/types";

import type { Metadata } from "next";
import { Suspense } from "react";

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
  const currentYear = params.year ?? "all";
  const currentMonth = params.month ?? "all";
  const currentCalendar = params.calendar ?? "all";
  const currentDelivery = params.delivery ?? "all";
  const currentWave = params.wave ?? "all";

  const { data, error } = await supabaseAdmin.from("orders").select("*");

  if (error) {
    throw new Error(error.message);
  }

  const allOrders = (data ?? []) as OrderRow[];
  const availableYears = getAvailableYears(allOrders);
  const orders = sortOrders(
    filterAdminOrders(allOrders, {
      year: currentYear,
      month: currentMonth,
      calendar: currentCalendar,
      delivery: currentDelivery,
      wave: currentWave,
    }),
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
        <div className="mb-8">
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
        </div>

        <div className="mb-6">
          <Suspense fallback={null}>
            <AdminOrdersFilterPersistence />
            <AdminOrdersFilters
              availableYears={availableYears}
              currentYear={currentYear}
              currentMonth={currentMonth}
              currentCalendar={currentCalendar}
              currentDelivery={currentDelivery}
              currentWave={currentWave}
              undownloadedCount={undownloadedCount}
            />
          </Suspense>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#EAD6DE] bg-white shadow-xl shadow-[#3E0F28]/10">
          <AdminOrdersTable
            orders={orders}
            currentSort={currentSort}
            currentDir={currentDir}
            currentYear={currentYear}
            currentMonth={currentMonth}
            currentCalendar={currentCalendar}
            currentDelivery={currentDelivery}
            currentWave={currentWave}
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
