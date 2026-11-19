import { OrderRow } from "@/app/types/types";
import { isFulfillablePaymentStatus } from "@/helpers/payment-method";

export type WorkflowStepId = "download" | "notify" | "complete";

export type WorkflowStep = {
  id: WorkflowStepId;
  label: string;
  actionLabel: string;
  done: boolean;
  isCurrent: boolean;
  clickable: boolean;
};

export function isOrderFullyProcessed(order: OrderRow) {
  return (
    isFulfillablePaymentStatus(order.payment_status) &&
    order.status === "completed"
  );
}

export function getWorkflowSteps(order: OrderRow): {
  isPaid: boolean;
  isCompleted: boolean;
  currentStepId: WorkflowStepId | null;
  steps: WorkflowStep[];
} {
  // Placed with an offline payment (not verified on the site) or an older
  // order paid online.
  const isPaid = isFulfillablePaymentStatus(order.payment_status);
  const isCompleted = order.status === "completed";
  const isNotified = ["ready", "shipped", "completed"].includes(order.status);

  let currentStepId: WorkflowStepId | null = null;

  if (isPaid && !order.downloaded_at) {
    currentStepId = "download";
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
      id: "notify",
      label: "Pripravené",
      actionLabel: "Odoslať info o odbere",
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
    case "notify":
      return `${prefix} „Pripravené“ a odoslať zákazníkovi e-mail o odbere?`;
    case "complete":
      return `${prefix} „Vybavené“ a uzavrieť objednávku?`;
    default:
      return "Pokračovať?";
  }
}
