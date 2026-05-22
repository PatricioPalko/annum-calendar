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

type AdminDeleteOrderButtonProps = {
  orderId: string;
  orderCode: string;
};

export function AdminDeleteOrderButton({
  orderId,
  orderCode,
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
      <Button
        type="button"
        variant="destructive"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Zmazať objednávku"
        className="size-8 rounded-md"
      >
        <Trash2 className="size-4" />
      </Button>

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
            >
              Zrušiť
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
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
