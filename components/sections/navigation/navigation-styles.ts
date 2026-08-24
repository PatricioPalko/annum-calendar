import { cn } from "@/lib/utils";

const navigationLinkTransition =
  "transition-[border-color,color] duration-150 ease-out [transition-delay:0ms,80ms] hover:[transition-delay:0ms,80ms]";

export const navigationLinkClassName = cn(
  "border-b-2 border-transparent pb-0.5 text-sm font-bold text-primary/80",
  navigationLinkTransition,
  "hover:border-[#FC5A61] hover:text-[#FC5A61]",
  "lg:text-[15px]",
);

export const navigationLinkActiveClassName = "border-[#FC5A61] text-[#FC5A61]";

export const mobileNavigationLinkClassName = cn(
  "rounded-md border border-transparent px-3 py-2.5 text-sm font-bold text-primary/80",
  "transition-[border-color,color,background-color] duration-150 ease-out [transition-delay:0ms,80ms,0ms]",
  "hover:border-[#FC5A61] hover:bg-white hover:text-[#FC5A61]",
);

export const mobileNavigationLinkActiveClassName =
  "border-[#FC5A61] bg-white text-[#FC5A61]";

export function getNavigationLinkClassName(isActive: boolean) {
  return cn(
    navigationLinkClassName,
    isActive && navigationLinkActiveClassName,
  );
}

export function getMobileNavigationLinkClassName(isActive: boolean) {
  return cn(
    mobileNavigationLinkClassName,
    isActive && mobileNavigationLinkActiveClassName,
  );
}
