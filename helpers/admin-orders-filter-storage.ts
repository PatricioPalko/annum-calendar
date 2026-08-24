const STORAGE_KEY = "annum-admin-orders-filter";

export type AdminOrdersFilterPreference = {
  year: string;
  month: string;
  calendar: string;
  delivery: string;
  wave: string;
};

export function readAdminOrdersFilterPreference():
  | AdminOrdersFilterPreference
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AdminOrdersFilterPreference>;

    if (
      typeof parsed.year === "string" &&
      typeof parsed.month === "string"
    ) {
      return {
        year: parsed.year,
        month: parsed.month,
        calendar: parsed.calendar ?? "all",
        delivery: parsed.delivery ?? "all",
        wave: parsed.wave ?? "all",
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function writeAdminOrdersFilterPreference(
  preference: AdminOrdersFilterPreference,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
}
