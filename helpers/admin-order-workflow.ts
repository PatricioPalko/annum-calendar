import { OrderRow } from "@/app/types/types";

export type WorkflowStepId = "download" | "packeta" | "notify" | "complete";

export type WorkflowStep = {
  id: WorkflowStepId;
  label: string;
  actionLabel: string;
  done: boolean;
  isCurrent: boolean;
  clickable: boolean;
};

export function isOrderFullyProcessed(order: OrderRow) {
  return order.payment_status === "paid" && order.status === "completed";
}

export function getWorkflowSteps(order: OrderRow): {
  isPaid: boolean;
  isPacketa: boolean;
  isCompleted: boolean;
  currentStepId: WorkflowStepId | null;
  steps: WorkflowStep[];
} {
  const isPaid = order.payment_status === "paid";
  const isPacketa = order.delivery_method === "packeta";
  const isCompleted = order.status === "completed";
  const isNotified = ["ready", "shipped", "completed"].includes(order.status);

  let currentStepId: WorkflowStepId | null = null;

  if (isPaid && !order.downloaded_at) {
    currentStepId = "download";
  } else if (isPaid && isPacketa && !order.tracking_number) {
    currentStepId = "packeta";
  } else if (isPaid && !isNotified) {
    currentStepId = "notify";
  } else if (
    isPaid &&
    !isCompleted &&
    (order.status === "ready" || order.status === "shipped")
  ) {
    currentStepId = "complete";
  }

  const stepDefinitions: Array<{
    id: WorkflowStepId;
    label: string;
    actionLabel: string;
    done: boolean;
    show: boolean;
    clickable: boolean;
  }> = [
    {
      id: "download",
      label: order.downloaded_at ? "Stiahnuté" : "Stiahnuť",
      actionLabel: "Stiahnuť podklady",
      done: Boolean(order.downloaded_at),
      show: isPaid,
      clickable: isPaid,
    },
    {
      id: "packeta",
      label: "Štítok",
      actionLabel: "Vytvoriť štítok",
      done: Boolean(order.tracking_number),
      show: isPaid && isPacketa,
      clickable: isPaid && isPacketa,
    },
    {
      id: "notify",
      label: isPacketa ? "Odoslané" : "Pripravené",
      actionLabel: isPacketa
        ? "Odoslať info o odoslaní"
        : "Odoslať info o odberu",
      done: isNotified,
      show: isPaid,
      clickable: isPaid,
    },
    {
      id: "complete",
      label: "Vybavené",
      actionLabel: "Označiť vybavené",
      done: isCompleted,
      show: isPaid,
      clickable:
        isPaid &&
        (isCompleted ||
          order.status === "ready" ||
          order.status === "shipped"),
    },
  ];

  const steps: WorkflowStep[] = stepDefinitions
    .filter((step) => step.show)
    .map((step) => ({
      id: step.id,
      label: step.label,
      actionLabel: step.actionLabel,
      done: step.done,
      isCurrent: step.id === currentStepId,
      clickable: step.clickable,
    }));

  return {
    isPaid,
    isPacketa,
    isCompleted,
    currentStepId,
    steps,
  };
}

export function getWorkflowConfirmMessage(
  stepId: WorkflowStepId,
  isRepeat: boolean,
  options?: { isUncompleting?: boolean },
) {
  if (stepId === "complete" && options?.isUncompleting) {
    return "Odoznačiť objednávku ako nevybavenú?";
  }

  const prefix = isRepeat ? "Zopakovať krok" : "Spustiť krok";

  switch (stepId) {
    case "download":
      return `${prefix} „Stiahnuté“?`;
    case "packeta":
      return `${prefix} „Štítok“? Ak už existuje, Packeta vráti existujúci štítok.`;
    case "notify":
      return `${prefix} „Odoslané / Pripravené“ a odoslať email zákazníkovi?`;
    case "complete":
      return `${prefix} „Vybavené“ a uzavrieť objednávku?`;
    default:
      return "Pokračovať?";
  }
}
