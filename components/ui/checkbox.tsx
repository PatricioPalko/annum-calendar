"use client";

import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        [
          "peer flex size-5 shrink-0 items-center justify-center rounded-md border border-[#EAD6DE] bg-white",
          "text-white shadow-sm transition-all duration-200 outline-none",
          "hover:border-[#FC5A61]/60 hover:bg-[#FFF7F4]",
          "focus-visible:border-[#FC5A61] focus-visible:ring-4 focus-visible:ring-[#FC5A61]/15",
          "data-[state=checked]:border-[#FC5A61] data-[state=checked]:bg-[#FC5A61]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-[#FC5A61] aria-invalid:ring-4 aria-invalid:ring-[#FC5A61]/15",
        ].join(" "),
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        <CheckIcon className="size-3.5 stroke-2" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
