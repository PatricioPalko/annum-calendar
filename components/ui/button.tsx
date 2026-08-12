import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center uppercase tracking-wider hover:cursor-pointer justify-center gap-2 rounded-md text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-[#FC5A61]/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-[#E94D54] bg-[#FC5A61] text-white shadow-sm hover:border-[#E94D54] hover:bg-[#E94D54] shadow-md",

        secondary:
          "border border-[#EAD6DE] bg-[#FFF7F4] text-[#3E0F28] shadow-sm hover:border-[#FC5A61]/40 hover:bg-white",

        lime: "border border-[#B7F02F] bg-[#C8FF3D] text-[#3E0F28] shadow-sm hover:border-[#B7F02F] hover:bg-[#B7F02F]",

        dark: "border border-[#3E0F28] bg-[#3E0F28] text-[#FFF7F4] shadow-sm hover:border-[#521536] hover:bg-[#521536]",

        outline:
          "border border-[#EAD6DE] bg-white text-[#3E0F28] hover:border-[#FC5A61]/40 hover:bg-[#FFF7F4]",

        ghost: "border border-transparent text-[#3E0F28] hover:bg-[#FFF7F4]",

        link: "border border-transparent text-[#FC5A61] underline-offset-4 hover:underline",

        destructive:
          "border border-red-100 bg-red-50 text-red-700 hover:bg-red-100",
      },
      size: {
        default: "h-9 px-4 py-2 text-xs sm:h-11 sm:px-5 sm:py-2.5 sm:text-sm",
        sm: "h-8 rounded-md px-3 text-xs sm:h-9 sm:px-4 sm:text-sm",
        lg: "h-10 px-5 py-2.5 text-sm sm:h-12 sm:px-6 sm:py-3 sm:text-base",
        icon: "size-9 sm:size-11",
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
