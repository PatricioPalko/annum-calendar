"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { AdminBulkDownloadButton } from "@/components/admin/admin-bulk-download-button";
import { buildAdminHref } from "@/helpers/admin-table";
import { writeAdminOrdersFilterPreference } from "@/helpers/admin-orders-filter-storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTH_LABELS = [
  "Január",
  "Február",
  "Marec",
  "Apríl",
  "Máj",
  "Jún",
  "Júl",
  "August",
  "September",
  "Október",
  "November",
  "December",
] as const;

type AdminOrdersFiltersProps = {
  availableYears: number[];
  currentYear?: string;
  currentMonth?: string;
  currentCalendar?: string;
  currentDelivery?: string;
  undownloadedCount: number;
};

export function AdminOrdersFilters({
  availableYears,
  currentYear = "all",
  currentMonth = "all",
  currentCalendar = "all",
  currentDelivery = "all",
  undownloadedCount,
}: AdminOrdersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(
    key: "year" | "month" | "calendar" | "delivery",
    value: string,
  ) {
    const next = {
      year: key === "year" ? value : currentYear,
      month: key === "month" ? value : currentMonth,
      calendar: key === "calendar" ? value : currentCalendar,
      delivery: key === "delivery" ? value : currentDelivery,
    };

    writeAdminOrdersFilterPreference(next);

    router.push(
      buildAdminHref({
        sort: searchParams.get("sort") ?? undefined,
        dir: (searchParams.get("dir") as "asc" | "desc" | null) ?? undefined,
        ...next,
      }),
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Select value={currentYear} onValueChange={(value) => updateFilter("year", value)}>
          <SelectTrigger size="sm" className="w-full sm:w-44" aria-label="Filter podľa roka">
            <SelectValue placeholder="Rok" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Všetky roky</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentMonth}
          onValueChange={(value) => updateFilter("month", value)}
        >
          <SelectTrigger size="sm" className="w-full sm:w-48" aria-label="Filter podľa mesiaca">
            <SelectValue placeholder="Mesiac" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Všetky mesiace</SelectItem>
            {MONTH_LABELS.map((label, index) => (
              <SelectItem key={label} value={String(index + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentCalendar}
          onValueChange={(value) => updateFilter("calendar", value)}
        >
          <SelectTrigger
            size="sm"
            className="w-full sm:w-52"
            aria-label="Filter podľa typu kalendára"
          >
            <SelectValue placeholder="Kalendár" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Všetky kalendáre</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentDelivery}
          onValueChange={(value) => updateFilter("delivery", value)}
        >
          <SelectTrigger
            size="sm"
            className="w-full sm:w-48"
            aria-label="Filter podľa doručenia"
          >
            <SelectValue placeholder="Doručenie" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Všetky spôsoby</SelectItem>
            <SelectItem value="pickup">Odber</SelectItem>
            <SelectItem value="packeta">Doručenie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch lg:ml-auto">
        <AdminBulkDownloadButton disabled={undownloadedCount === 0} />
      </div>
    </div>
  );
}
