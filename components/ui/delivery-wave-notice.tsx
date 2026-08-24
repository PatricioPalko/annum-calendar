import { CalendarClock } from "lucide-react";

import {
  formatWaveDeadline,
  formatWaveDeliveryBy,
  getDeliveryWaveForDate,
} from "@/lib/order/delivery-waves";
import { cn } from "@/lib/utils";

type DeliveryWaveNoticeProps = {
  variant?: "compact" | "default";
  className?: string;
};

export function DeliveryWaveNotice({
  variant = "default",
  className,
}: DeliveryWaveNoticeProps) {
  const wave = getDeliveryWaveForDate(new Date());
  const isStandard = wave.key === "standard";

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-start gap-2.5 rounded-md border border-[#EAD6DE] bg-[#FFF7F4] px-3 py-2.5",
          className,
        )}
      >
        <CalendarClock
          className="mt-0.5 size-4 shrink-0 text-secondary"
          aria-hidden="true"
        />
        <div className="min-w-0 text-sm">
          <p className="font-bold text-primary">{wave.customerHeadline}</p>
          <p className="mt-0.5 font-medium leading-5 text-primary/60">
            {isStandard
              ? wave.customerDetail
              : `Objednávka do ${formatWaveDeadline(wave)} · doručenie do ${formatWaveDeliveryBy(wave)}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-[#EAD6DE] bg-white px-4 py-3 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-lime text-primary">
          <CalendarClock className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-wide text-secondary">
            Termín doručenia
          </p>
          <p className="mt-1 text-base font-bold text-primary">
            {wave.customerHeadline}
          </p>
          <p className="mt-1 text-sm font-medium leading-6 text-primary/65">
            {wave.customerDetail}
          </p>
          {!isStandard && (
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-primary/50">Objednávka do</dt>
                <dd className="font-bold text-primary">
                  {formatWaveDeadline(wave)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-primary/50">Doručenie do</dt>
                <dd className="font-bold text-primary">
                  {formatWaveDeliveryBy(wave)}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
