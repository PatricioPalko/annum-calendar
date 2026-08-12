"use client";

import { FileJson2 } from "lucide-react";
import { useState } from "react";

import { OrderRow } from "@/app/types/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOrderJsonPreview } from "@/helpers/admin-orders";
import { cn } from "@/lib/utils";

type AdminOrderJsonPreviewProps = {
  order: OrderRow;
  variant?: "icon" | "link";
};

export function AdminOrderJsonPreview({
  order,
  variant = "icon",
}: AdminOrderJsonPreviewProps) {
  const [open, setOpen] = useState(false);
  const preview = getOrderJsonPreview(order);

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer text-[#3E0F28]/45 transition hover:text-[#FC5A61]"
        >
          JSON
        </button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => setOpen(true)}
          title="Zobraziť JSON"
          aria-label="Zobraziť JSON"
          className={cn("size-5 rounded-md p-0 sm:size-5 [&_svg]:size-2.5")}
        >
          <FileJson2 className="size-2.5" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-[#EAD6DE] bg-white p-0 shadow-2xl sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader className="border-b border-[#EAD6DE] px-5 py-4">
            <DialogTitle className="font-heading text-xl font-bold text-[#3E0F28]">
              JSON · {order.order_code ?? order.id}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-auto px-5 py-4">
            <pre className="whitespace-pre-wrap rounded-xl bg-[#180914] p-4 text-xs leading-6 text-[#FFF7F4] sm:text-sm">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
