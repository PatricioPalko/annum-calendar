import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";
import {
  formatWaveDeadline,
  formatWaveDeliveryBy,
  getDeliveryWaveForDate,
  getUpcomingDeliveryWaves,
  isCurrentDeliveryWave,
} from "@/lib/order/delivery-waves";
import { cn } from "@/lib/utils";

export function DeliveryWavesSection() {
  const currentWave = getDeliveryWaveForDate(new Date());
  const upcomingWaves = getUpcomingDeliveryWaves(new Date());

  return (
    <section
      id="terminy-dorucenia"
      className="scroll-mt-24 -mx-4 mt-12 bg-primary px-4 py-10 text-[#FFF7F4] sm:-mx-6 sm:mt-16 sm:px-6 sm:py-14"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel className="text-lime">Termíny doručenia</SectionLabel>

          <Heading as="h2" className="mt-2 text-white">
            Kedy môže byť kalendár u vás
          </Heading>

          <Text variant="lead" className="mx-auto mt-3 text-[#FFF7F4]/85">
            Objednávky pripravujeme v spoločných várkach tlače. Ak objednáte a
            zaplatíte do uvedeného termínu, kalendár doručíme v príslušnom
            doručovacom okne.
          </Text>
        </div>

        {upcomingWaves.length > 0 ? (
          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-xl border-2 border-[#FC5A61] bg-white/5">
            <div className="hidden grid-cols-[1.4fr_0.9fr_0.9fr] gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#FFF7F4]/55 sm:grid sm:px-5 sm:text-sm">
              <span>Várka</span>
              <span>Objednávka do</span>
              <span>Odoslanie do</span>
            </div>

            <ul className="divide-y divide-white/10">
              {upcomingWaves.map((wave) => {
                const isCurrent = isCurrentDeliveryWave(wave);

                return (
                  <li
                    key={wave.key}
                    className={cn(
                      "px-4 py-2.5 sm:px-5 sm:py-3",
                      isCurrent
                        ? "bg-[#FC5A61]/25 ring-1 ring-inset ring-[#FC5A61]/45"
                        : "bg-transparent",
                    )}
                  >
                    <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1.4fr_0.9fr_0.9fr] sm:items-center sm:gap-3">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-bold leading-5 sm:text-[15px]",
                            isCurrent ? "text-[#FC5A61]" : "text-white",
                          )}
                        >
                          {wave.customerHeadline}
                          {isCurrent ? (
                            <span className="ml-1.5 font-semibold text-[#FFF7F4]">
                              · aktuálna
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <p className="text-sm leading-5 sm:text-[15px]">
                        <span className="font-medium text-[#FFF7F4]/45 sm:hidden">
                          Objednávka do{" "}
                        </span>
                        <span className="font-bold text-white">
                          {formatWaveDeadline(wave)}
                        </span>
                      </p>

                      <p className="text-sm leading-5 sm:text-[15px]">
                        <span className="font-medium text-[#FFF7F4]/45 sm:hidden">
                          Odoslanie do{" "}
                        </span>
                        <span className="font-bold text-white">
                          {formatWaveDeliveryBy(wave)}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center">
            <p className="text-sm font-bold text-white">
              {currentWave.customerHeadline}
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Button variant="lime" asChild>
            <Link href="/objednavka">Vytvoriť spomienky</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
