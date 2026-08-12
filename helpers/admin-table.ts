import { OrderRow, SortKey } from "@/app/types/types";

export function getCalendarTypeBadgeClass(type: string) {
  switch (type) {
    case "basic":
      return "text-[#3E0F28]/50";

    case "premium":
      return " text-secondary";

    case "business":
      return " text-primary";

    default:
      return "text-[#3E0F28]";
  }
}

export function getCalendarTypeDotClass(type: string) {
  switch (type) {
    case "basic":
      return "bg-[#3E0F28]/50";

    case "premium":
      return "bg-secondary";

    case "business":
      return "bg-primary";

    default:
      return "bg-[#EAD6DE]";
  }
}
export function getCalendarTypeLabel(type: string) {
  switch (type) {
    case "basic":
      return "Basic";

    case "premium":
      return "Premium";

    case "business":
      return "Business";

    default:
      return type;
  }
}

export type AdminOrdersFilterParams = {
  sort?: SortKey;
  dir?: "asc" | "desc";
  year?: string;
  month?: string;
  calendar?: string;
  delivery?: string;
};

export function buildAdminHref(params: AdminOrdersFilterParams) {
  const searchParams = new URLSearchParams();

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  if (params.dir) {
    searchParams.set("dir", params.dir);
  }

  if (params.year && params.year !== "all") {
    searchParams.set("year", params.year);
  }

  if (params.month && params.month !== "all") {
    searchParams.set("month", params.month);
  }

  if (params.calendar && params.calendar !== "all") {
    searchParams.set("calendar", params.calendar);
  }

  if (params.delivery && params.delivery !== "all") {
    searchParams.set("delivery", params.delivery);
  }

  const query = searchParams.toString();

  return query ? `/admin?${query}` : "/admin";
}

export function getSortHref(
  sort: SortKey,
  currentSort: SortKey,
  currentDir: "asc" | "desc",
  filters?: Pick<AdminOrdersFilterParams, "year" | "month" | "calendar" | "delivery">,
) {
  const nextDir = currentSort === sort && currentDir === "asc" ? "desc" : "asc";

  return buildAdminHref({
    sort,
    dir: nextDir,
    year: filters?.year,
    month: filters?.month,
    calendar: filters?.calendar,
    delivery: filters?.delivery,
  });
}

export function filterOrdersByPeriod(
  orders: OrderRow[],
  year?: string,
  month?: string,
) {
  if ((!year || year === "all") && (!month || month === "all")) {
    return orders;
  }

  return orders.filter((order) => {
    const date = new Date(order.created_at);

    if (year && year !== "all" && date.getFullYear() !== Number(year)) {
      return false;
    }

    if (month && month !== "all" && date.getMonth() + 1 !== Number(month)) {
      return false;
    }

    return true;
  });
}

export function filterAdminOrders(
  orders: OrderRow[],
  filters: Pick<AdminOrdersFilterParams, "year" | "month" | "calendar" | "delivery">,
) {
  return orders.filter((order) => {
    const date = new Date(order.created_at);

    if (
      filters.year &&
      filters.year !== "all" &&
      date.getFullYear() !== Number(filters.year)
    ) {
      return false;
    }

    if (
      filters.month &&
      filters.month !== "all" &&
      date.getMonth() + 1 !== Number(filters.month)
    ) {
      return false;
    }

    if (
      filters.calendar &&
      filters.calendar !== "all" &&
      order.calendar_type !== filters.calendar
    ) {
      return false;
    }

    if (
      filters.delivery &&
      filters.delivery !== "all" &&
      order.delivery_method !== filters.delivery
    ) {
      return false;
    }

    return true;
  });
}

export function getAvailableYears(orders: OrderRow[]) {
  const years = new Set<number>();

  for (const order of orders) {
    years.add(new Date(order.created_at).getFullYear());
  }

  return [...years].sort((a, b) => b - a);
}

export function sortOrders(
  orders: OrderRow[],
  sort: SortKey,
  dir: "asc" | "desc",
) {
  const multiplier = dir === "asc" ? 1 : -1;

  return [...orders].sort((a, b) => {
    switch (sort) {
      case "order_code":
        return (
          (a.order_code ?? "").localeCompare(b.order_code ?? "") * multiplier
        );

      case "customer":
        return (
          `${a.last_name} ${a.first_name}`.localeCompare(
            `${b.last_name} ${b.first_name}`,
            "sk",
          ) * multiplier
        );

      case "calendar_type":
        return a.calendar_type.localeCompare(b.calendar_type) * multiplier;

      case "quantity":
        return (a.quantity - b.quantity) * multiplier;

      case "photos":
        return ((a.photos?.length ?? 0) - (b.photos?.length ?? 0)) * multiplier;

      case "downloaded":
        return (
          (Number(Boolean(a.downloaded_at)) -
            Number(Boolean(b.downloaded_at))) *
          multiplier
        );

      case "created_at":
      default:
        return (
          (new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()) *
          multiplier
        );
    }
  });
}
