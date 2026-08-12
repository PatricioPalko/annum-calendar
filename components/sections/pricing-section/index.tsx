import {
  calendarTypes,
  getLowestUnitPrice,
} from "@/app/types/types";
import { formatEuroPrice } from "@/helpers/format-euro-price";
import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { ORDER_SHARED_INCLUSIONS } from "@/lib/order/config";

const basicPlan = calendarTypes.find((plan) => plan.value === "basic")!;
const premiumPlan = calendarTypes.find((plan) => plan.value === "premium")!;
const businessPlan = calendarTypes.find((plan) => plan.value === "business")!;

const sharedInclusions = [...ORDER_SHARED_INCLUSIONS];

const plans = [
  {
    plan: basicPlan,
    subtitle: "Jednoduchý kalendár s fotkami",
    features: [
      "12 mesiacov s Vašimi fotkami",
      "Bez vyznačených menín a narodenín",
      "Jednoduchý dizajn, v ktorom vyniknú Vaše fotky",
    ],
    buttonLabel: "Objednať",
  },
  {
    plan: premiumPlan,
    subtitle: "Kalendár s fotkami + dôležité dátumy",
    features: [
      "Všetko z Basic",
      "Zvýraznené narodeniny",
      "Zvýraznené meniny",
      "Dátumy zadáte priamo v objednávke",
    ],
    buttonLabel: "Objednať",
  },
  {
    plan: businessPlan,
    subtitle: "Pre firmy a väčšie objednávky",
    features: [
      "Rovnaké kalendáre pre tím, klientov alebo partnerov",
      "Logo, firemné fotky a farby podľa dohody",
      "Individuálna príprava a komunikácia pred tlačou",
    ],
    buttonLabel: "Objednať",
  },
];

export function PricingSection() {
  return (
    <section
      id="cennik"
      className="scroll-mt-24 mx-auto mt-8 max-w-6xl overflow-hidden rounded-xl border-2 border-[#EAD6DE] bg-white px-3 py-8 text-primary shadow-2xl shadow-[#3E0F28]/20 sm:px-4 sm:py-12"
    >
      <div className="mb-10 text-center">
        <Text
          variant="caption"
          className="text-sm font-extrabold uppercase tracking-[0.2em] text-secondary"
        >
          Cenník
        </Text>

        <Heading as="h2" className="mt-3">
          Vyberte si typ kalendára
        </Heading>

        <Text className="mx-auto mt-4 max-w-2xl">
          Presnú sumu uvidíte v konfigurátore podľa zvoleného typu a počtu
          kusov.
        </Text>
      </div>

      <div className="grid py-4 md:grid-cols-3">
        {plans.map(({ plan, subtitle, features, buttonLabel }) => {
          const isPremium = plan.value === "premium";
          const lowestUnitPrice = getLowestUnitPrice(plan);
          const accentClassName = isPremium ? "bg-[#FC5A61]" : "bg-secondary";

          return (
            <article
              key={plan.value}
              className={[
                "relative m-2 flex flex-col rounded-xl px-4 pb-6 pt-8 md:px-8 lg:px-10",
                isPremium
                  ? "bg-[#FFF7F4] shadow-xl shadow-[#FC5A61]/10 ring-2 ring-[#FC5A61]"
                  : "bg-white",
              ].join(" ")}
            >
              {isPremium && (
                <Text className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-md bg-[#C8FF3D] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#3E0F28] shadow-sm">
                  Najobľúbenejší
                </Text>
              )}

              <div
                className={[
                  "inline-flex w-fit items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm font-semibold",
                  isPremium
                    ? "border-[#FC5A61]/30 bg-white text-[#3E0F28]"
                    : "border-[#EAD6DE] bg-[#FFF7F4] text-[#7B5A6B]",
                ].join(" ")}
              >
                <Text
                  variant="small"
                  className="font-extrabold uppercase tracking-wide"
                >
                  {plan.label}
                </Text>
              </div>

              {lowestUnitPrice !== null && (
                <div className="mt-6 flex flex-wrap items-end gap-1">
                  <span className="pb-0.5 text-base font-bold text-primary sm:text-xl">
                    od
                  </span>

                  <span className="whitespace-nowrap font-body text-3xl font-bold leading-none tracking-tight text-primary sm:text-5xl md:text-7xl">
                    {formatEuroPrice(lowestUnitPrice)}
                  </span>

                  <span className="pb-1 pl-1 text-base font-bold text-primary sm:text-xl">
                    / ks
                  </span>
                </div>
              )}

              <Text
                variant="body"
                className="mt-3 font-semibold text-[#3E0F28]"
              >
                {subtitle}
              </Text>

              <ul className="mt-8 grow space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="flex h-6 shrink-0 items-center mt-0.5">
                      <span
                        className={`flex size-5 items-center justify-center rounded-full text-white ${accentClassName}`}
                      >
                        <Check className="size-3 stroke-3" />
                      </span>
                    </span>

                    <Text as="span" variant="body" className="block min-w-0 flex-1">
                      {feature}
                    </Text>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant={isPremium ? "lime" : "default"}
                className="mt-10 w-full"
              >
                <Link href="/objednavka">{buttonLabel}</Link>
              </Button>
            </article>
          );
        })}
      </div>

      <div className="mx-2 mt-4 rounded-xl border border-[#EAD6DE] bg-[#FFF7F4] px-4 py-5 sm:mx-4 sm:px-6">
        <Text className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#FC5A61]">
          V každej objednávke
        </Text>

        <ul className="mt-4 space-y-2">
          {sharedInclusions.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm font-medium leading-6 text-[#3E0F28]/80"
            >
              <span className="flex h-6 w-4 shrink-0 items-center justify-center text-[#FC5A61]">
                <Check className="size-4" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
