import { cn } from "@/lib/utils";

export const orderFormOptionCardClassName = cn(
  "relative grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)] gap-x-2.5 gap-y-2 rounded-lg border border-[#EAD6DE] bg-[#FFF7F4]/40 p-3 transition-all duration-200",
  "hover:border-[#FC5A61]/45 hover:bg-[#FFF7F4]",
  "data-[selected=true]:border-[#FC5A61] data-[selected=true]:bg-[#FFF7F4] data-[selected=true]:shadow-sm",
);

export const orderFormRadioClassName =
  "size-4 self-center [&_[data-slot=radio-group-indicator]_span]:size-1.5";

export const orderFormSubsectionLabelClassName =
  "text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#FC5A61]";

export const orderFormFieldHintClassName =
  "text-xs leading-relaxed text-[#3E0F28]/55 sm:text-sm";

export const orderFormInputClassName =
  "h-9 px-3 py-1.5 sm:h-10 sm:px-3";

export const orderFormSelectTriggerClassName =
  "h-9 px-2.5 sm:h-10 sm:px-3";

export const orderFormTextareaClassName = "min-h-24 px-3 py-2.5";

export const orderFormPriceClassName = "text-base font-bold text-[#3E0F28]";

export const orderFormPriceVatClassName =
  "text-[0.55em] font-medium text-[#3E0F28]/45";

export const orderFormPriceTotalClassName =
  "font-body text-xl font-bold text-[#3E0F28] sm:text-2xl";

export const orderFormPriceTotalVatClassName =
  "text-[0.45em] font-semibold text-[#3E0F28]/45";

export const orderFormBirthdayControlClassName = cn(
  orderFormInputClassName,
  "text-sm font-semibold",
);

export const orderFormBirthdaySelectClassName =
  orderFormBirthdayControlClassName;

export const orderFormQuantityCardClassName = cn(
  "relative flex h-full cursor-pointer flex-col rounded-lg border border-[#EAD6DE] bg-[#FFF7F4]/40 p-3 transition-all duration-200",
  "hover:border-[#FC5A61]/45 hover:bg-[#FFF7F4]",
  "data-[selected=true]:border-[#FC5A61] data-[selected=true]:bg-[#FFF7F4] data-[selected=true]:shadow-sm",
);

export const orderFormQuantityCardHeaderClassName =
  "grid grid-cols-[1rem_minmax(0,1fr)] items-center gap-x-2.5";

export const orderFormQuantityCardBodyClassName = "col-start-2";

export const orderFormQuantityCardFooterClassName =
  "mt-auto border-t border-[#EAD6DE]/70 pt-2.5";
