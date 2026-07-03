"use client";

import { useEffect } from "react";

import { clearOrderFormDraft } from "@/lib/order-from-draft";

export function ClearOrderFormDraft() {
  useEffect(() => {
    clearOrderFormDraft();
  }, []);

  return null;
}
