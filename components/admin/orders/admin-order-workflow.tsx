"use client";

import { Check, Circle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OrderRow } from "@/app/types/types";
import {
  completeOrder,
  createPacketaLabel,
  downloadOrderPhotos,
  notifyOrderFulfillment,
} from "@/helpers/admin-order-actions";
import {
  getWorkflowConfirmMessage,
  getWorkflowSteps,
  type WorkflowStepId,
} from "@/helpers/admin-order-workflow";
import { cn } from "@/lib/utils";

type AdminOrderWorkflowProps = {
  order: OrderRow;
  align?: "start" | "end";
};

export function AdminOrderWorkflow({
  order,
  align = "end",
}: AdminOrderWorkflowProps) {
  const router = useRouter();
  const [activeStepId, setActiveStepId] = useState<WorkflowStepId | null>(null);

  const { isPaid, isPacketa, steps } = getWorkflowSteps(order);

  async function runStep(stepId: WorkflowStepId, isRepeat: boolean) {
    const isUncompleting =
      stepId === "complete" && isRepeat && order.status === "completed";
    const confirmed = window.confirm(
      getWorkflowConfirmMessage(stepId, isRepeat, { isUncompleting }),
    );

    if (!confirmed) {
      return;
    }

    setActiveStepId(stepId);

    try {
      switch (stepId) {
        case "download":
          await downloadOrderPhotos(order.id, order.order_code ?? order.id);
          break;
        case "packeta":
          await createPacketaLabel(order.id);
          break;
        case "notify": {
          const trackingNumberInput =
            isPacketa && !order.tracking_number
              ? window
                  .prompt("Zadaj tracking číslo Packety, ak ho máš:", "")
                  ?.trim()
              : order.tracking_number ?? undefined;

          await notifyOrderFulfillment(order.id, trackingNumberInput);
          break;
        }
        case "complete":
          await completeOrder(order.id);
          break;
      }

      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Akcia sa nepodarila.",
      );
    } finally {
      setActiveStepId(null);
    }
  }

  return (
    <div className={cn(align === "end" ? "text-right" : "text-left")}>
      {!isPaid ? (
        <p className="text-[12px] font-bold uppercase tracking-wide text-[#3E0F28]/40">
          Čaká na platbu
        </p>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-1",
            align === "end" ? "items-end" : "items-start",
          )}
        >
          {steps.map((step) => {
            const isLoading = activeStepId === step.id;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!step.clickable || isLoading}
                onClick={() => runStep(step.id, step.done)}
                title={step.actionLabel}
                className={cn(
                  "inline-flex max-w-full cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1 text-left text-[12px] font-bold uppercase tracking-wide transition",
                  step.done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : step.isCurrent
                      ? "border-[#FC5A61]/30 bg-[#FC5A61]/10 text-[#FC5A61] hover:bg-[#FC5A61]/15"
                      : "border-[#EAD6DE] bg-white text-[#3E0F28]/55 hover:bg-[#FFF7F4]",
                  !step.clickable && "cursor-default opacity-50",
                  align === "end" && "flex-row-reverse text-right",
                )}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 shrink-0 animate-spin" />
                ) : step.done ? (
                  <Check className="size-3.5 shrink-0" strokeWidth={3} />
                ) : step.isCurrent ? (
                  <span className="size-3.5 shrink-0 text-center leading-3.5">
                    →
                  </span>
                ) : (
                  <Circle className="size-3.5 shrink-0" strokeWidth={2} />
                )}
                <span className="truncate">{step.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
