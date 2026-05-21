import { OrderRow, SortKey } from "@/app/types/types";

export function getCalendarTypeBadgeClass(type: string) {
  switch (type) {
    case "basic":
      return "border-[#EAD6DE] bg-[#FFF7F4] text-[#3E0F28]";

    case "premium":
      return "border-secondary bg-[#FFF7F4] text-secondary";

    case "business":
      return "border-[#3E0F28]/20 bg-[#3E0F28] text-white";

    default:
      return "border-[#EAD6DE] bg-white text-[#3E0F28]";
  }
}

export function getCalendarTypeDotClass(type: string) {
  switch (type) {
    case "basic":
      return "bg-[#EAD6DE]";

    case "premium":
      return "bg-secondary";

    case "business":
      return "bg-white";

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

export function getSortHref(
  sort: SortKey,
  currentSort: SortKey,
  currentDir: "asc" | "desc",
) {
  const nextDir = currentSort === sort && currentDir === "asc" ? "desc" : "asc";

  return `/admin?sort=${sort}&dir=${nextDir}`;
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
