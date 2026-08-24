import { Check } from "lucide-react";

import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type OrderSectionProps = {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description?: string;
  isComplete?: boolean;
  isActive?: boolean;
  isOptional?: boolean;
  children: React.ReactNode;
};

export default function OrderSection({
  stepNumber,
  totalSteps,
  title,
  description,
  isComplete = false,
  isActive = false,
  isOptional = false,
  children,
}: OrderSectionProps) {
  const stepLabel = `${stepNumber}/${totalSteps}`;

  return (
    <section
      className={cn(
        "scroll-mt-24 rounded-xl border p-4 shadow-sm transition-colors duration-200 sm:p-5",
        isComplete
          ? "border-emerald-200/90 bg-emerald-50/35"
          : isActive
            ? "border-[#FC5A61]/35 bg-white ring-1 ring-[#FC5A61]/12"
            : "border-[#EAD6DE] bg-white",
      )}
    >
      <header
        className={cn(
          "mb-4 flex items-start gap-3 border-b pb-3",
          isComplete ? "border-emerald-200/70" : "border-[#EAD6DE]/60",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "flex h-8 min-w-[3rem] shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-extrabold leading-none sm:h-9 sm:min-w-[3.25rem] sm:text-sm",
            isComplete
              ? "bg-emerald-600 text-white"
              : isActive
                ? "bg-[#FC5A61] text-white"
                : "bg-[#3E0F28]/15 text-[#3E0F28]/70",
          )}
        >
          {isComplete ? <Check className="size-4 stroke-[3]" /> : stepLabel}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Heading
              as="h3"
              className={cn(
                "text-lg leading-tight sm:text-xl",
                isComplete && "text-[#3E0F28]/85",
              )}
            >
              {title}
            </Heading>

            {!isComplete && isOptional ? (
              <span className="rounded-full bg-[#FFF7F4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3E0F28]/45 ring-1 ring-[#EAD6DE]">
                Voliteľné
              </span>
            ) : null}
          </div>

          {description ? (
            <Text
              variant="body"
              className={cn(
                "mt-1 text-sm leading-snug",
                isComplete ? "text-[#3E0F28]/50" : "text-[#3E0F28]/65",
              )}
            >
              {description}
            </Text>
          ) : null}
        </div>
      </header>

      <div>{children}</div>
    </section>
  );
}
