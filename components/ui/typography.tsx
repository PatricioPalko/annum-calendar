import { cn } from "@/lib/utils";

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

export function Heading({
  as: Comp = "h2",
  className,
  ...props
}: HeadingProps) {
  return (
    <Comp
      className={cn(
        "font-heading font-bold tracking-tight text-primary",
        {
          h1: "text-[1.75rem] leading-[1.05] sm:text-5xl sm:leading-[0.98] md:text-7xl md:leading-[0.95]",
          h2: "text-[1.375rem] leading-tight sm:text-3xl md:text-5xl",
          h3: "text-lg leading-tight sm:text-xl md:text-2xl",
          h4: "text-base leading-tight sm:text-lg md:text-xl",
          h5: "text-sm leading-tight sm:text-base md:text-lg",
          h6: "text-xs leading-tight sm:text-sm md:text-base",
        }[Comp],
        className,
      )}
      {...props}
    />
  );
}

type TextVariant = "body" | "lead" | "small" | "muted" | "caption";

type TextProps = React.ComponentProps<"p"> & {
  variant?: TextVariant;
  as?: "p" | "span";
};

const textVariants: Record<TextVariant, string> = {
  body: "text-sm font-medium leading-6 tracking-normal text-[#3E0F28]/72 sm:text-base sm:leading-7",
  lead: "text-sm font-semibold leading-6 tracking-normal text-primary/70 sm:text-base sm:leading-7 md:text-[17px] md:leading-8",
  small: "text-xs font-medium leading-5 tracking-normal text-[#3E0F28]/68 sm:text-sm sm:leading-6",
  muted: "text-xs font-medium leading-5 tracking-normal text-[#3E0F28]/55 sm:text-sm sm:leading-6",
  caption:
    "text-[11px] font-bold uppercase leading-5 tracking-[0.14em] text-secondary sm:text-xs md:text-md md:tracking-[0.16em]",
};

export function Text({
  variant = "body",
  className,
  as: Comp = "p",
  ...props
}: TextProps) {
  return <Comp className={cn(textVariants[variant], className)} {...props} />;
}
