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
          h1: "text-[1.875rem] leading-[1.08] tracking-[-0.02em] sm:text-5xl sm:leading-[1.02] md:text-7xl md:leading-[0.98]",
          h2: "text-[1.4rem] leading-[1.15] tracking-[-0.015em] sm:text-3xl md:text-5xl",
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

const sectionLabelClassName =
  "block font-body text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]";

type SectionLabelProps = React.ComponentProps<"span"> & {
  as?: "span" | "p";
};

export function SectionLabel({
  as: Comp = "span",
  className,
  ...props
}: SectionLabelProps) {
  return <Comp className={cn(sectionLabelClassName, className)} {...props} />;
}

type TextVariant = "body" | "lead" | "small" | "muted" | "caption";

type TextProps = React.ComponentProps<"p"> & {
  variant?: TextVariant;
  as?: "p" | "span";
};

const textVariants: Record<TextVariant, string> = {
  body: "text-sm font-semibold leading-[1.65] tracking-[0.01em] text-[#3E0F28]/78 sm:text-base sm:leading-[1.7]",
  lead: "text-[15px] font-semibold leading-[1.65] tracking-[0.015em] text-primary/78 sm:text-base sm:leading-[1.75] md:text-[17px] md:leading-8",
  small: "text-xs font-semibold leading-6 tracking-[0.01em] text-[#3E0F28]/72 sm:text-sm sm:leading-[1.65]",
  muted: "text-xs font-medium leading-6 tracking-[0.01em] text-[#3E0F28]/58 sm:text-sm sm:leading-[1.65]",
  caption: sectionLabelClassName,
};

export function Text({
  variant = "body",
  className,
  as: Comp = "p",
  ...props
}: TextProps) {
  return <Comp className={cn(textVariants[variant], className)} {...props} />;
}
