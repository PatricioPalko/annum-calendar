"use client";

import { MoreHorizontal } from "lucide-react";
import { useSyncExternalStore } from "react";

import { OrderRow } from "@/app/types/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AdminDeleteOrderButton } from "../admin-delete-order-button";
import { AdminOrderJsonPreview } from "./admin-order-json-preview";

const emptySubscribe = () => () => {};

type AdminOrderActionsMenuProps = {
  order: OrderRow;
};

export function AdminOrderActionsMenu({ order }: AdminOrderActionsMenuProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-primary/50"
        aria-label="Ďalšie akcie"
        tabIndex={-1}
        aria-hidden
      >
        <MoreHorizontal className="size-4" />
        <span className="sr-only">Ďalšie akcie</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-primary/50"
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Ďalšie akcie</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48 bg-background p-1">
        <AdminOrderJsonPreview order={order} />
        <DropdownMenuSeparator />
        <AdminDeleteOrderButton
          orderId={order.id}
          orderCode={order.order_code ?? order.id}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
