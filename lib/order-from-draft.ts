import type { OrderFormValues } from "@/lib/schema";

const ORDER_FORM_DRAFT_KEY = "annum-order-form-draft-v1";

type OrderFormDraft = Omit<OrderFormValues, "photos">;

export function saveOrderFormDraft(values: OrderFormValues) {
  if (typeof window === "undefined") {
    return;
  }

  const { photos: _photos, ...draft } = values;

  localStorage.setItem(ORDER_FORM_DRAFT_KEY, JSON.stringify(draft));
}

export function loadOrderFormDraft(): Partial<OrderFormValues> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(ORDER_FORM_DRAFT_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<OrderFormValues>;
  } catch {
    localStorage.removeItem(ORDER_FORM_DRAFT_KEY);
    return null;
  }
}

export function clearOrderFormDraft() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ORDER_FORM_DRAFT_KEY);
}
