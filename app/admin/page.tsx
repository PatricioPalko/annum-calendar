import { CheckCircle2, DownloadIcon, Inbox } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { AdminBulkDownloadButton } from "@/components/admin/admin-bulk-download-button";
import { AdminDeleteOrderButton } from "@/components/admin/admin-delete-order-button";
import { AdminDownloadButton } from "@/components/admin/admin-download-button";
import { AdminMarkDownloadedCompletedButton } from "@/components/admin/admin-mark-downloaded-completed-button";
import { formatPrice } from "@/helpers/admin-order-price";
import {
  getCalendarTypeBadgeClass,
  getCalendarTypeDotClass,
  getCalendarTypeLabel,
  getSortHref,
  sortOrders,
} from "@/helpers/admin-table";
import {
  formatDate,
  formatDateOnly,
  formatTimeOnly,
} from "@/helpers/format-date-time";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import { OrderRow, SearchParams, SortKey } from "../types/types";

function SortLink({
  sort,
  currentSort,
  currentDir,
  children,
}: {
  sort: SortKey;
  currentSort: SortKey;
  currentDir: "asc" | "desc";
  children: React.ReactNode;
}) {
  const isActive = sort === currentSort;

  return (
    <Link
      href={getSortHref(sort, currentSort, currentDir)}
      className="inline-flex items-center gap-1 font-bold transition hover:text-[#FC5A61]"
    >
      {children}
      <span className="text-xs text-[#3E0F28]/40">
        {isActive ? (currentDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </Link>
  );
}

function truncateText(value: string, maxLength = 80) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

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

  const downloadedNotCompletedCount = orders.filter(
    (order) => order.downloaded_at && order.status !== "completed",
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

  const customPriceCount = orders.filter(
    (order) => order.total_price === null || order.total_price === undefined,
  ).length;

  let previousDate: string | null = null;

  return (
    <main className="min-h-screen bg-[#FFF7F4] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]">
              Admin
            </p>

            <h1 className="mt-2 font-heading text-4xl font-bold text-[#3E0F28]">
              Objednávky
            </h1>

            <p className="mt-2 text-sm font-medium text-[#3E0F28]/60">
              Spolu {orders.length} objednávok · nestiahnuté {undownloadedCount}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <AdminBulkDownloadButton disabled={undownloadedCount === 0} />

            <AdminMarkDownloadedCompletedButton
              disabled={downloadedNotCompletedCount === 0}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#EAD6DE] bg-white shadow-xl shadow-[#3E0F28]/10">
          <div>
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#FFF7F4] text-left text-[#3E0F28]">
                <tr>
                  <th className="w-12 px-4 py-3 font-bold">#</th>

                  <th className="px-4 py-3">
                    <SortLink
                      sort="order_code"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Objednávka
                    </SortLink>
                  </th>

                  <th className="px-4 py-3">
                    <SortLink
                      sort="customer"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Zákazník
                    </SortLink>
                  </th>

                  <th className="px-4 py-3">
                    <SortLink
                      sort="calendar_type"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Kalendár
                    </SortLink>
                  </th>

                  <th className="px-4 py-3">
                    <SortLink
                      sort="downloaded"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Stav
                    </SortLink>
                  </th>

                  <th className="px-4 py-3 text-right font-bold">Akcie</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EAD6DE]">
                {orders.map((order, index) => {
                  const orderDate = formatDate(order.created_at);
                  const shouldRenderDateSeparator = orderDate !== previousDate;
                  previousDate = orderDate;

                  return (
                    <Fragment key={order.id}>
                      {shouldRenderDateSeparator && (
                        <tr>
                          <td
                            colSpan={6}
                            className="bg-[#3E0F28] px-4 py-2 text-xs font-extrabold uppercase tracking-tighter text-[#FFF7F4]"
                          >
                            {orderDate}
                          </td>
                        </tr>
                      )}

                      <tr
                        className={cn(
                          "text-[#3E0F28]",
                          index % 2 === 0 ? "bg-[#FFF7F4]" : "bg-white",
                        )}
                      >
                        <td className="px-3 py-3 align-top font-bold text-[#3E0F28]/50">
                          {index + 1}
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1">
                            <p
                              className="font-bold text-[#3E0F28]"
                              title={order.order_code ?? order.id}
                            >
                              {order.order_code ?? order.id}
                            </p>

                            <p className="text-xs font-medium text-[#3E0F28]/55">
                              {formatDateOnly(order.created_at)} ·{" "}
                              {formatTimeOnly(order.created_at)}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1">
                            <p className="font-bold">
                              {order.first_name} {order.last_name}
                            </p>

                            <p className="text-xs font-medium text-[#3E0F28]/65">
                              {order.email}
                            </p>

                            <p className="text-xs font-medium text-[#3E0F28]/55">
                              {order.phone ?? "Bez telefónu"}
                            </p>
                          </div>
                        </td>

                        <td className="w-70 max-w-70 px-3 py-3 align-top">
                          <div className="space-y-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-2 rounded-md py-1 text-xs font-extrabold uppercase tracking-wide",
                                getCalendarTypeBadgeClass(order.calendar_type),
                              )}
                            >
                              <span
                                className={cn(
                                  "size-2 rounded-md",
                                  getCalendarTypeDotClass(order.calendar_type),
                                )}
                              />
                              {getCalendarTypeLabel(order.calendar_type)}
                            </span>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[#3E0F28]/65">
                              <span>{order.quantity} ks</span>

                              <span>
                                {order.total_price !== null
                                  ? formatPrice(Number(order.total_price))
                                  : "Cena na mieru"}
                              </span>

                              <span>{order.photos?.length ?? 0} fotiek</span>
                            </div>

                            {order.note && (
                              <div className="max-w-[260px] rounded-md border border-[#FC5A61]/20 bg-white px-3 py-2">
                                <p className="text-[10px] font-extrabold uppercase text-[#FC5A61]">
                                  Poznámka
                                </p>

                                <div className="mt-1 max-h-20 overflow-y-auto pr-2 text-xs font-semibold leading-5 text-[#3E0F28]/80">
                                  <p className="whitespace-pre-wrap break-words">
                                    {order.note}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          {order.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[#3E0F28]/80 bg-[#C8FF3D]/70 px-2.5 py-1 text-xs font-bold text-[#3E0F28]">
                              <CheckCircle2 className="size-4" />
                              Vybavené
                            </span>
                          ) : order.downloaded_at ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-secondary bg-[#FFF7F4] px-2.5 py-1 text-xs font-bold text-secondary">
                              <DownloadIcon className="size-4" />
                              Stiahnuté
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[#3E0F28]/80 bg-[#FFF7F4] px-2.5 py-1 text-xs font-bold text-[#3E0F28]/80">
                              <Inbox className="size-4" />
                              Nové
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top text-right">
                          <div className="flex justify-end gap-2">
                            <AdminDownloadButton
                              orderId={order.id}
                              fileName={order.order_code ?? order.id}
                            />

                            <AdminDeleteOrderButton
                              orderId={order.id}
                              orderCode={order.order_code ?? order.id}
                            />
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}

                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-[#3E0F28]/60"
                    >
                      Zatiaľ nemáte žiadne objednávky.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-12 border-t border-[#EAD6DE] bg-white shadow-lg shadow-[#3E0F28]/5">
            <div className="grid md:grid-cols-3">
              <div className="p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FC5A61]">
                  Objednávky
                </p>

                <p className="mt-2 text-2xl font-bold text-[#3E0F28]">
                  {orders.length}
                </p>

                <p className="mt-1 text-sm font-medium text-[#3E0F28]/60">
                  Celkový počet objednávok
                </p>
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

                <p className="mt-2 text-2xl font-bold text-[#3E0F28]">
                  {formatPrice(totalPrice)}
                </p>

                <p className="mt-1 text-sm font-medium text-[#3E0F28]/60">
                  Súčet objednávok s pevnou cenou
                  {customPriceCount > 0
                    ? ` · ${customPriceCount} na mieru`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
