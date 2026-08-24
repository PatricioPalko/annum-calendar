import { cn } from "@/lib/utils";

type RecommendedBadgeProps = {
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  variant?: "pink" | "lime";
};

export function RecommendedBadge({
  children,
  className,
  showIcon = false,
  variant = "pink",
}: RecommendedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] shadow-sm sm:text-[10px]",
        variant === "lime"
          ? "bg-[#C8FF3D] text-[#3E0F28]"
          : "bg-[#FC5A61] text-white",
        className,
      )}
    >
      {showIcon ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-2.5 shrink-0 fill-none stroke-current stroke-[2.5]"
        >
          <path d="M9 12 11 14 15 10" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ) : null}
      {children}
    </span>
  );
}

export const recommendedBadgeLabel = "Najobľúbenejší";

export const orderFormRecommendedBadgeClassName =
  "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 text-[10px] font-extrabold sm:text-[11px]";

export const showcaseLabelClassName =
  "inline-flex rounded-md bg-[#FC5A61] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-md sm:px-3.5 sm:text-xs";
