import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { AdminBulkDownloadButton } from "@/components/admin/admin-bulk-download-button";
import { AdminDownloadButton } from "@/components/admin/admin-download-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPrice, getAdminOrderPrice } from "@/helpers/admin-order-price";
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

          <AdminBulkDownloadButton disabled={undownloadedCount === 0} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#EAD6DE] bg-white shadow-xl shadow-[#3E0F28]/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-350 border-collapse text-sm">
              <thead className="bg-[#FFF7F4] text-left text-[#3E0F28]">
                <tr>
                  <th className="px-4 py-3 font-bold">#</th>
                  <th className="px-4 py-3">
                    <SortLink
                      sort="order_code"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Kód
                    </SortLink>
                  </th>
                  <th className="px-4 py-3">
                    <SortLink
                      sort="created_at"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Dátum
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
                  <th className="px-4 py-3 font-bold">Kontakt</th>
                  <th className="px-4 py-3">
                    <SortLink
                      sort="calendar_type"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Typ
                    </SortLink>
                  </th>
                  <th className="px-4 py-3">
                    <SortLink
                      sort="quantity"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Ks
                    </SortLink>
                  </th>
                  <th className="px-4 py-3 font-bold">Cena</th>
                  <th className="px-4 py-3">
                    <SortLink
                      sort="photos"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Fotky
                    </SortLink>
                  </th>
                  <th className="px-4 py-3 font-bold">Poznámka</th>
                  <th className="px-4 py-3">
                    <SortLink
                      sort="downloaded"
                      currentSort={currentSort}
                      currentDir={currentDir}
                    >
                      Stav
                    </SortLink>
                  </th>
                  <th className="px-4 py-3 text-right font-bold">Export</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EAD6DE]">
                {orders.map((order, index) => {
                  const orderDate = formatDate(order.created_at);
                  const shouldRenderDateSeparator = orderDate !== previousDate;
                  previousDate = orderDate;

                  const price = getAdminOrderPrice({
                    type: order.calendar_type,
                    quantity: order.quantity,
                  });

                  const totalPrice = price.totalPrice;

                  return (
                    <Fragment key={order.id}>
                      {shouldRenderDateSeparator && (
                        <tr>
                          <td
                            colSpan={12}
                            className="bg-[#3E0F28] px-4 py-2 text-xs font-extrabold uppercase tracking-tighter text-[#FFF7F4]"
                          >
                            {orderDate}
                          </td>
                        </tr>
                      )}

                      <tr className="text-[#3E0F28] hover:bg-[#FFF7F4]/60">
                        <td className="px-4 py-3 font-bold text-[#3E0F28]/50">
                          {index + 1}
                        </td>

                        <td className="w-40 px-4 py-3">
                          <div className="leading-tight">
                            <p
                              className="truncate font-bold text-[#3E0F28]"
                              title={order.order_code ?? order.id}
                            >
                              {order.order_code
                                ?.split("-")
                                .slice(0, 2)
                                .join("-") ?? order.id}
                            </p>

                            {order.order_code && (
                              <p className="mt-1 text-xs font-semibold text-[#3E0F28]/55">
                                {order.order_code.split("-").slice(2).join("-")}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="w-28 px-4 py-3">
                          <div className="leading-tight">
                            <p className="font-semibold text-[#3E0F28]">
                              {formatDateOnly(order.created_at)}
                            </p>

                            <p className="mt-1 text-xs font-medium text-[#3E0F28]/55">
                              {formatTimeOnly(order.created_at)}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold">
                            {order.first_name} {order.last_name}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div>{order.email}</div>
                          <div className="text-xs text-[#3E0F28]/60">
                            {order.phone ?? "—"}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide",
                              getCalendarTypeBadgeClass(order.calendar_type),
                            )}
                          >
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                getCalendarTypeDotClass(order.calendar_type),
                              )}
                            />
                            {getCalendarTypeLabel(order.calendar_type)}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-center">
                          {order.quantity}ks
                        </td>

                        <td className="px-4 py-3 font-bold text-center">
                          {totalPrice !== null
                            ? formatPrice(totalPrice)
                            : "Na mieru"}
                        </td>

                        <td className="px-4 py-3 font-semibold text-center">
                          {order.photos?.length ?? 0}
                        </td>

                        <td className="w-60 max-w-60 px-4 py-3 align-middle">
                          {order.note ? (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="line-clamp-2 cursor-help break-words text-xs leading-5 text-[#3E0F28]/70">
                                    {order.note}
                                  </p>
                                </TooltipTrigger>

                                <TooltipContent
                                  side="top"
                                  align="start"
                                  className="max-w-sm whitespace-pre-wrap break-words rounded-md border border-[#EAD6DE] bg-white p-3 text-xs leading-5 text-[#3E0F28] shadow-xl"
                                >
                                  {order.note}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <div className="flex justify-center">
                              <span className="text-xs font-semibold text-[#3E0F28]/35">
                                —
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {order.downloaded_at ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#C8FF3D]/40 px-2.5 py-1 text-xs font-bold text-[#3E0F28]">
                              <CheckCircle2 className="size-4" />
                              Stiahnuté
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#FFF7F4] px-2.5 py-1 text-xs font-bold text-[#3E0F28]/60">
                              Nové
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <AdminDownloadButton
                            orderId={order.id}
                            fileName={order.order_code ?? order.id}
                          />
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}

                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-10 text-center text-[#3E0F28]/60"
                    >
                      Zatiaľ nemáte žiadne objednávky.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
