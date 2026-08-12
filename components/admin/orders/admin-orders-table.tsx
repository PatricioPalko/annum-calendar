import Link from "next/link";
import { Fragment } from "react";

import { getSortHref } from "@/helpers/admin-table";
import { formatDate } from "@/helpers/format-date-time";

import { OrderRow, SortKey } from "@/app/types/types";
import { AdminOrderCard } from "./admin-order-card";
import { AdminOrderRow } from "./admin-order-row";

function SortLink({
  sort,
  currentSort,
  currentDir,
  currentYear,
  currentMonth,
  currentCalendar,
  currentDelivery,
  children,
}: {
  sort: SortKey;
  currentSort: SortKey;
  currentDir: "asc" | "desc";
  currentYear?: string;
  currentMonth?: string;
  currentCalendar?: string;
  currentDelivery?: string;
  children: React.ReactNode;
}) {
  const isActive = sort === currentSort;

  return (
    <Link
      href={getSortHref(sort, currentSort, currentDir, {
        year: currentYear,
        month: currentMonth,
        calendar: currentCalendar,
        delivery: currentDelivery,
      })}
      className="inline-flex items-center gap-1 font-bold transition hover:text-[#FC5A61]"
    >
      {children}
      <span className="text-xs text-[#3E0F28]/40">
        {isActive ? (currentDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </Link>
  );
}

type AdminOrdersTableProps = {
  orders: OrderRow[];
  currentSort: SortKey;
  currentDir: "asc" | "desc";
  currentYear?: string;
  currentMonth?: string;
  currentCalendar?: string;
  currentDelivery?: string;
};

export function AdminOrdersTable({
  orders,
  currentSort,
  currentDir,
  currentYear,
  currentMonth,
  currentCalendar,
  currentDelivery,
}: AdminOrdersTableProps) {
  if (orders.length === 0) {
    const hasActiveFilters =
      currentYear !== "all" ||
      currentMonth !== "all" ||
      currentCalendar !== "all" ||
      currentDelivery !== "all";

    const emptyMessage = hasActiveFilters
      ? "Pre zvolené filtre nemáte žiadne objednávky."
      : "Zatiaľ nemáte žiadne objednávky.";

    return (
      <p className="px-4 py-10 text-center text-[#3E0F28]/60">{emptyMessage}</p>
    );
  }

  const tableRows = orders.map((order, index) => {
    const orderDate = formatDate(order.created_at);
    const previousDate =
      index > 0 ? formatDate(orders[index - 1]!.created_at) : null;

    return {
      order,
      index,
      orderDate,
      shouldRenderDateSeparator: orderDate !== previousDate,
    };
  });

  return (
    <>
      <div className="space-y-4 p-4 md:hidden">
        {orders.map((order, index) => (
          <AdminOrderCard key={order.id} order={order} index={index} />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead className="bg-[#FFF7F4] text-left text-[#3E0F28]">
            <tr>
              <th className="w-12 px-4 py-3 font-bold">#</th>

              <th className="px-4 py-3">
                <SortLink
                  sort="order_code"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  currentCalendar={currentCalendar}
                  currentDelivery={currentDelivery}
                >
                  Objednávka
                </SortLink>
              </th>

              <th className="px-4 py-3">
                <SortLink
                  sort="customer"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  currentCalendar={currentCalendar}
                  currentDelivery={currentDelivery}
                >
                  Zákazník
                </SortLink>
              </th>

              <th className="px-4 py-3">
                <SortLink
                  sort="calendar_type"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  currentCalendar={currentCalendar}
                  currentDelivery={currentDelivery}
                >
                  Kalendár
                </SortLink>
              </th>

              <th className="px-4 py-3 font-bold">Doručenie</th>
              <th className="px-4 py-3 font-bold">Platba</th>

              <th className="min-w-56 px-4 py-3 font-bold">Spracovanie</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EAD6DE]">
            {tableRows.map(
              ({ order, index, orderDate, shouldRenderDateSeparator }) => (
                <Fragment key={order.id}>
                  {shouldRenderDateSeparator && (
                    <tr>
                      <td
                        colSpan={7}
                        className="bg-[#3E0F28] px-4 py-2 text-xs font-extrabold uppercase tracking-tighter text-[#FFF7F4]"
                      >
                        {orderDate}
                      </td>
                    </tr>
                  )}

                  <AdminOrderRow order={order} index={index} />
                </Fragment>
              ),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
