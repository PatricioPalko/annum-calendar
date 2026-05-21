// src/components/order-success-dialog.tsx

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OrderSuccessDialogProps = {
  open: boolean;
  orderCode?: string;
  onOpenChange: (open: boolean) => void;
};

export function OrderSuccessDialog({
  open,
  orderCode,
  onOpenChange,
}: OrderSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border border-[#EAD6DE] bg-white p-6 shadow-2xl sm:max-w-md">
        <DialogHeader className="flex justify-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-md bg-lime text-xl font-extrabold text-[#3E0F28]">
            ✓
          </div>

          <DialogTitle className="font-heading text-3xl font-bold text-[#3E0F28]">
            Objednávka bola odoslaná
          </DialogTitle>

          <DialogDescription className="text-sm leading-6 text-[#3E0F28]/70">
            Ďakujeme. Objednávku sme prijali a čoskoro Vás budeme kontaktovať
            e-mailom s potvrdením a ďalším postupom.
          </DialogDescription>
        </DialogHeader>

        {orderCode && (
          <div className="rounded-xl border border-[#EAD6DE] bg-[#FFF7F4] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FC5A61]">
              Číslo objednávky
            </p>
            <p className="mt-1 text-md font-bold text-[#3E0F28]">{orderCode}</p>
          </div>
        )}

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Zavrieť
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
