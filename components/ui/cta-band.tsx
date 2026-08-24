import { cn } from "@/lib/utils";

type CtaBandProps = {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
};

export function CtaBand({ children, className, innerClassName }: CtaBandProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-primary text-[#FFF7F4] shadow-2xl shadow-[#3E0F28]/20",
        className,
      )}
    >
      <div className={innerClassName}>{children}</div>
    </div>
  );
}
