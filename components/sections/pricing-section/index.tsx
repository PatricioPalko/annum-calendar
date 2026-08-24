import { calendarTypes, getLowestUnitPrice } from "@/app/types/types";
import { Check, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PriceWithVat } from "@/components/ui/price-with-vat";
import {
  RecommendedBadge,
  recommendedBadgeLabel,
} from "@/components/ui/recommended-badge";
import {
  BASIC_PRICING_FEATURES,
  MEMORY_SET_PRICING_FEATURES,
  PREMIUM_PRICING_FEATURES,
} from "@/lib/order/config";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";

const basicPlan = calendarTypes.find((plan) => plan.value === "basic")!;
const premiumPlan = calendarTypes.find((plan) => plan.value === "premium")!;
const memoryPlan = calendarTypes.find((plan) => plan.value === "memory")!;

const productPlans = [
  {
    plan: basicPlan,
    subtitle: "Jednoduchý kalendár plný spomienok",
    features: [...BASIC_PRICING_FEATURES],
    buttonLabel: "Vytvoriť spomienky",
    href: "/objednavka",
  },
  {
    plan: premiumPlan,
    subtitle: "Spomienky s dôležitými dátumami",
    features: [...PREMIUM_PRICING_FEATURES],
    buttonLabel: "Vytvoriť spomienky",
    href: "/objednavka",
  },
  {
    plan: memoryPlan,
    subtitle: "Premium kalendár s kolážou a venovaním",
    features: [...MEMORY_SET_PRICING_FEATURES],
    buttonLabel: "Vytvoriť spomienky",
    href: "/objednavka",
  },
] as const;

export function PricingSection() {
  return (
    <section
      id="cennik"
      className="scroll-mt-24 mx-auto mt-8 max-w-6xl overflow-hidden rounded-xl border-2 border-[#EAD6DE] bg-white px-3 py-8 text-primary shadow-2xl shadow-[#3E0F28]/20 sm:px-4 sm:py-12"
    >
      <div className="mb-10 text-center">
        <SectionLabel>Cenník</SectionLabel>

        <Heading as="h2" className="mt-3">
          Koľko stojí kalendár spomienok
        </Heading>

        <Text className="mx-auto mt-4 max-w-2xl">
          V cene je príprava, tlač, zabalenie a set na zavesenie. Všetky ceny
          sú uvedené s DPH.
        </Text>
      </div>

      <div className="grid py-4 md:grid-cols-3">
        {productPlans.map(({ plan, subtitle, features, buttonLabel, href }) => {
          const isPremium = plan.value === "premium";
          const lowestUnitPrice = getLowestUnitPrice(plan);
          const accentClassName = isPremium
            ? "bg-[#FC5A61] text-white"
            : "bg-secondary text-white";

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
                <RecommendedBadge
                  variant="lime"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 text-[11px] normal-case tracking-normal sm:text-xs"
                >
                  {recommendedBadgeLabel}
                </RecommendedBadge>
              )}

              <span
                className={[
                  "inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]",
                  isPremium
                    ? "bg-[#FC5A61] text-white shadow-sm"
                    : "bg-[#FC5A61]/10 text-[#FC5A61]",
                ].join(" ")}
              >
                {plan.label}
              </span>

              {lowestUnitPrice !== null && (
                <div className="mt-6">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary/45">
                    Cena od
                  </p>
                  <PriceWithVat
                    value={lowestUnitPrice}
                    perUnit
                    className="mt-1 font-body text-3xl font-bold tracking-tight text-primary sm:text-4xl"
                    vatClassName="text-[0.38em] font-semibold text-primary/40"
                  />
                </div>
              )}

              <Text
                variant="body"
                className="mt-3 font-semibold text-[#3E0F28]"
              >
                {subtitle}
              </Text>

              <ul className="mt-8 grow space-y-3">
                {features.map((feature) => {
                  const useCheckMarker =
                    plan.value === "basic" ||
                    feature === "Všetko z balíka Basic" ||
                    feature === "Všetko z balíka Premium";

                  return (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 shrink-0 items-center">
                      {useCheckMarker ? (
                        <span
                          className={`flex size-5 items-center justify-center rounded-full ${accentClassName}`}
                        >
                          <Check className="size-3 stroke-3" />
                        </span>
                      ) : (
                        <span className="flex size-5 items-center justify-center rounded-full bg-[#FC5A61]/10 text-[#FC5A61]">
                          <Plus className="size-3 stroke-3" aria-hidden />
                        </span>
                      )}
                    </span>

                    <Text as="span" variant="body" className="block min-w-0 flex-1">
                      {feature}
                    </Text>
                  </li>
                  );
                })}
              </ul>

              <Button
                asChild
                size="lg"
                variant={isPremium ? "lime" : "default"}
                className="mt-10 w-full"
              >
                <Link href={href}>{buttonLabel}</Link>
              </Button>
            </article>
          );
        })}
      </div>

      <p className="mx-2 mt-6 max-w-2xl text-center text-sm font-medium leading-6 text-[#3E0F28]/60 sm:mx-auto">
        Pre firmy a objednávky od 10 kusov s logom pripravíme ponuku na mieru —{" "}
        <Link
          href="/pre-firmy"
          className="font-bold text-[#FC5A61] underline-offset-4 transition hover:underline"
        >
          nezáväzný dopyt
        </Link>
        .
      </p>
    </section>
  );
}
