"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { buildAdminHref } from "@/helpers/admin-table";
import { readAdminOrdersFilterPreference } from "@/helpers/admin-orders-filter-storage";

export function AdminOrdersFilterPersistence() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hasUrlFilters =
      searchParams.get("year") ||
      searchParams.get("month") ||
      searchParams.get("calendar") ||
      searchParams.get("delivery") ||
      searchParams.get("wave");

    if (hasUrlFilters) {
      return;
    }

    const stored = readAdminOrdersFilterPreference();

    if (!stored) {
      return;
    }

    if (
      stored.year === "all" &&
      stored.month === "all" &&
      stored.calendar === "all" &&
      stored.delivery === "all" &&
      stored.wave === "all"
    ) {
      return;
    }

    router.replace(
      buildAdminHref({
        sort: searchParams.get("sort") ?? undefined,
        dir: (searchParams.get("dir") as "asc" | "desc" | null) ?? undefined,
        year: stored.year,
        month: stored.month,
        calendar: stored.calendar,
        delivery: stored.delivery,
        wave: stored.wave,
      }),
    );
  }, [router, searchParams]);

  return null;
}
