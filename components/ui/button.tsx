import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-[#FC5A61]/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#FC5A61] text-white shadow-sm hover:bg-[#E94D54]",
        secondary:
          "border border-[#EAD6DE] bg-[#FFF7F4] text-[#3E0F28] hover:bg-white",
        lime: "bg-[#C8FF3D] text-[#3E0F28] shadow-sm hover:bg-[#B7F02F]",
        dark: "bg-[#3E0F28] text-[#FFF7F4] hover:bg-[#521536]",
        outline:
          "border border-[#EAD6DE] bg-white text-[#3E0F28] hover:bg-[#FFF7F4]",
        ghost: "text-[#3E0F28] hover:bg-[#FFF7F4]",
        link: "text-[#FC5A61] underline-offset-4 hover:underline",
        destructive: "bg-red-50 text-red-700 hover:bg-red-100",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-4 text-sm",
        lg: "h-12 px-6 py-3 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
