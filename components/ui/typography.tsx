import { cn } from "@/lib/utils";

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3";
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
          h1: "text-5xl leading-[0.95] md:text-7xl ",
          h2: "text-3xl leading-tight md:text-5xl",
          h3: "text-2xl leading-tight md:text-3xl",
        }[Comp],
        className,
      )}
      {...props}
    />
  );
}

type TextProps = React.HTMLAttributes<HTMLParagraphElement> & {
  variant?: "body" | "lead" | "small" | "muted";
};

export function Text({ variant = "body", className, ...props }: TextProps) {
  return (
    <p
      className={cn(
        {
          body: "text-base leading-7 text-primary",
          lead: "text-lg leading-8 text-muted",
          small: "text-sm leading-6 text-muted",
          muted: "text-sm leading-6 text-muted/80",
        }[variant],
        className,
      )}
      {...props}
    />
  );
}
