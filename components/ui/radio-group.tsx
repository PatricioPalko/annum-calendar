"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        [
          "relative flex size-5 shrink-0 items-center justify-center rounded-full border border-[#EAD6DE] bg-white",
          "transition-all duration-200 outline-none",
          "hover:border-[#FC5A61] hover:bg-[#FFF7F4]",
          "focus-visible:border-[#FC5A61] focus-visible:ring-4 focus-visible:ring-[#FC5A61]/15",
          "data-[state=checked]:border-[#FC5A61] data-[state=checked]:bg-[#FC5A61]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-[#FC5A61] aria-invalid:ring-4 aria-invalid:ring-[#FC5A61]/15",
        ].join(" "),
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <span className="size-2 rounded-full bg-white" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
