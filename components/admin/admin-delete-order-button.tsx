"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AdminDeleteOrderButtonProps = {
  orderId: string;
  orderCode: string;
  variant?: "icon" | "link";
};

export function AdminDeleteOrderButton({
  orderId,
  orderCode,
  variant = "icon",
}: AdminDeleteOrderButtonProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer text-[#3E0F28]/45 transition hover:text-red-600"
        >
          Zmazať
        </button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Zmazať objednávku"
          className={cn("size-5 rounded-md p-0 sm:size-5 [&_svg]:size-2.5")}
        >
          <Trash2 className="size-2.5" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border border-[#EAD6DE] bg-white p-6 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold text-[#3E0F28]">
              Zmazať objednávku?
            </DialogTitle>

            <DialogDescription className="text-sm leading-6 text-[#3E0F28]/70">
              Táto akcia natrvalo zmaže objednávku <strong>{orderCode}</strong>{" "}
              aj všetky nahraté fotky.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="h-8 px-3 text-xs sm:h-8 sm:px-3 sm:text-xs"
            >
              Zrušiť
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 px-3 text-xs sm:h-8 sm:px-3 sm:text-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Mažem...
                </>
              ) : (
                "Zmazať"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
