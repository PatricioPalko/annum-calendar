"use client";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        [
          "flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-[#EAD6DE] bg-white px-4",
          "text-sm font-semibold text-[#3E0F28] shadow-sm transition-all duration-200",
          "outline-none select-none whitespace-nowrap",
          "hover:border-[#FC5A61]/50 hover:bg-[#FFF7F4]",
          "focus-visible:border-[#FC5A61] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#FC5A61]/15",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#FFF7F4] disabled:text-[#3E0F28]/40 disabled:opacity-70",
          "aria-invalid:border-[#FC5A61] aria-invalid:bg-[#FFF7F4] aria-invalid:ring-4 aria-invalid:ring-[#FC5A61]/15",
          "data-[placeholder]:text-[#3E0F28]/40",
          "data-[size=default]:h-11",
          "data-[size=sm]:h-9 data-[size=sm]:px-3 data-[size=sm]:text-sm",
          "*:data-[slot=select-value]:line-clamp-1",
          "*:data-[slot=select-value]:flex",
          "*:data-[slot=select-value]:items-center",
          "*:data-[slot=select-value]:gap-1.5",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        ].join(" "),
        className,
      )}
      {...props}
    >
      {children}

      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 text-[#3E0F28]/50 transition-transform duration-200 data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          [
            "relative z-50 max-h-[320px] min-w-36 overflow-hidden rounded-xl border border-[#EAD6DE] bg-white text-[#3E0F28]",
            "shadow-xl shadow-[#3E0F28]/10",
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          ].join(" "),
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />

        <SelectPrimitive.Viewport
          data-slot="select-viewport"
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#3E0F28]/50",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        [
          "group relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 pr-9",
          "text-sm font-semibold text-[#3E0F28] outline-none transition-all duration-200",
          "data-[highlighted]:bg-[#FFF7F4] data-[highlighted]:text-[#3E0F28]",
          "data-[state=checked]:bg-[#FFF7F4] data-[state=checked]:text-[#3E0F28]",
          "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        ].join(" "),
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>

      <span className="pointer-events-none absolute right-3 flex size-5 items-center justify-center text-[#FC5A61] opacity-0 transition-opacity group-data-[state=checked]:opacity-100">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1 h-px bg-[#EAD6DE]",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center bg-white py-1 text-[#3E0F28]/50",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center bg-white py-1 text-[#3E0F28]/50",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
