import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        [
          "min-h-28 w-full min-w-0 resize-y rounded-md border border-[#EAD6DE] bg-white px-4 py-3",
          "text-sm font-semibold text-[#3E0F28] shadow-sm transition-all duration-200",
          "placeholder:text-[#3E0F28]/40",
          "outline-none",
          "hover:border-[#FC5A61]/50 hover:bg-[#FFF7F4]",
          "focus-visible:border-[#FC5A61] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#FC5A61]/15",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#FFF7F4] disabled:text-[#3E0F28]/40 disabled:opacity-70",
          "aria-invalid:border-[#FC5A61] aria-invalid:bg-[#FFF7F4] aria-invalid:ring-4 aria-invalid:ring-[#FC5A61]/15",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
