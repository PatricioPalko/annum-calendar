import { AdminOrdersFilterPersistence } from "@/components/admin/orders/admin-orders-filter-persistence";
import { AdminOrdersFilters } from "@/components/admin/orders/admin-orders-filters";
import { AdminOrdersSummary } from "@/components/admin/orders/admin-orders-summary";
import { AdminOrdersTable } from "@/components/admin/orders/admin-orders-table";
import {
  getOrderDiscountAmount,
  getOrderPaymentGroup,
  type OrderPaymentGroup,
} from "@/helpers/admin-orders";
import {
  filterAdminOrders,
  getAvailableYears,
  sortOrders,
} from "@/helpers/admin-table";
import { requireAdmin } from "@/lib/auth/admin";
import { getEnvProblems, hasEnvProblems } from "@/lib/env";
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
  const currentPayment = params.payment ?? "all";
  const currentWave = params.wave ?? "all";

  const { data, error } = await supabaseAdmin.from("orders").select("*");

  if (error) {
    throw new Error(error.message);
  }

  const envProblems = getEnvProblems();
  const allOrders = (data ?? []) as OrderRow[];
  const availableYears = getAvailableYears(allOrders);
  const orders = sortOrders(
    filterAdminOrders(allOrders, {
      year: currentYear,
      month: currentMonth,
      calendar: currentCalendar,
      payment: currentPayment,
      wave: currentWave,
    }),
    currentSort,
    currentDir,
  );

  const undownloadedCount = orders.filter(
    (order) => !order.downloaded_at,
  ).length;

  const paymentCounts: Record<OrderPaymentGroup, number> = {
    bank_transfer: 0,
    cash: 0,
    online: 0,
    pending: 0,
  };
  const paymentTotals: Record<OrderPaymentGroup, number> = {
    bank_transfer: 0,
    cash: 0,
    online: 0,
    pending: 0,
  };

  for (const order of orders) {
    const group = getOrderPaymentGroup(order);

    paymentCounts[group] += 1;

    if (order.total_price !== null && order.total_price !== undefined) {
      paymentTotals[group] += Number(order.total_price);
    }
  }

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
              · prevodom {paymentCounts.bank_transfer} · hotovosť{" "}
              {paymentCounts.cash}
            </p>
          </div>
        </div>

        {hasEnvProblems(envProblems) && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-[#FC5A61]/40 bg-white p-4 text-sm text-[#3E0F28]"
          >
            <p className="font-bold text-[#FC5A61]">
              Konfigurácia servera nie je úplná
            </p>

            {envProblems.missingRequired.length > 0 && (
              <p className="mt-1">
                Chýbajú premenné prostredia (objednávky alebo e-maily nemusia
                fungovať):{" "}
                <span className="font-mono text-xs">
                  {envProblems.missingRequired.join(", ")}
                </span>
              </p>
            )}

            {envProblems.warnings.map((warning) => (
              <p key={warning} className="mt-1">
                {warning}
              </p>
            ))}
          </div>
        )}

        {envProblems.missingRecommended.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-[#3E0F28]">
            <p className="font-bold text-amber-900">
              Odporúčané nastavenie (objednávky fungujú aj bez neho)
            </p>

            <ul className="mt-1 space-y-1">
              {envProblems.missingRecommended.map((entry) => (
                <li key={entry.name}>
                  <span className="font-mono text-xs">{entry.name}</span>:{" "}
                  {entry.purpose}
                </li>
              ))}
            </ul>

            <p className="mt-2 text-xs text-[#3E0F28]/60">
              Premenné nastavíte v hostingu (Vercel → Settings → Environment
              Variables) a lokálne v súbore .env.local. Po zmene treba
              aplikáciu znova nasadiť alebo reštartovať.
            </p>
          </div>
        )}

        <div className="mb-6">
          <Suspense fallback={null}>
            <AdminOrdersFilterPersistence />
            <AdminOrdersFilters
              availableYears={availableYears}
              currentYear={currentYear}
              currentMonth={currentMonth}
              currentCalendar={currentCalendar}
              currentPayment={currentPayment}
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
            currentPayment={currentPayment}
            currentWave={currentWave}
          />
          <AdminOrdersSummary
            ordersCount={orders.length}
            paymentCounts={paymentCounts}
            paymentTotals={paymentTotals}
            totalQuantity={totalQuantity}
            totalPrice={totalPrice}
            totalOriginalPrice={totalOriginalPrice}
            totalDiscountAmount={totalDiscountAmount}
            customPriceCount={customPriceCount}
          />
        </div>
      </div>
    </main>
  );
}
