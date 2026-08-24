import { formatEuroPrice } from "@/helpers/format-euro-price";
import { cn } from "@/lib/utils";

type PriceWithVatProps = {
  value: number;
  perUnit?: boolean;
  className?: string;
  amountClassName?: string;
  vatClassName?: string;
  prefix?: string;
  sign?: "+" | "−" | "";
};

export function PriceWithVat({
  value,
  perUnit = false,
  className,
  amountClassName,
  vatClassName,
  prefix,
  sign = "",
}: PriceWithVatProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-wrap items-baseline gap-x-1 leading-none",
        className,
      )}
    >
      {prefix ? <span className="font-inherit">{prefix}</span> : null}

      <span className={cn("whitespace-nowrap font-inherit", amountClassName)}>
        {sign}
        {formatEuroPrice(value)}
        {perUnit ? "/ks" : ""}
      </span>

      <span
        className={cn(
          "whitespace-nowrap text-[0.62em] font-medium leading-none tracking-normal text-primary/45",
          vatClassName,
        )}
      >
        s DPH
      </span>
    </span>
  );
}
