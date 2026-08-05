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
          h1: "text-4xl leading-[1.02] sm:text-5xl sm:leading-[0.98] md:text-7xl md:leading-[0.95]",
          h2: "text-3xl leading-tight md:text-5xl",
          h3: "text-2xl leading-tight md:text-3xl",
          h4: "text-xl leading-tight md:text-2xl",
          h5: "text-lg leading-tight md:text-xl",
          h6: "text-base leading-tight md:text-lg",
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
  body: "text-base font-medium leading-7 tracking-normal text-[#3E0F28]/72",
  lead: "text-base md:text-[17px] font-semibold leading-7 md:leading-8 tracking-normal text-primary/70",
  small: "text-sm font-medium leading-6 tracking-normal text-[#3E0F28]/68",
  muted: "text-sm font-medium leading-6 tracking-normal text-[#3E0F28]/55",
  caption:
    "text-md font-bold uppercase leading-5 tracking-[0.16em] text-secondary",
};

export function Text({
  variant = "body",
  className,
  as: Comp = "p",
  ...props
}: TextProps) {
  return <Comp className={cn(textVariants[variant], className)} {...props} />;
}
