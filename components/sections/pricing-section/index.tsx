import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";

const plans = [
  {
    name: "Basic",
    price: 15,
    subtitle: "iba fotky",
    description: "Kalendár s vašimi fotkami bez označených dátumov.",
    features: [
      "A3 nástenný kalendár",
      "Vlastné fotky",
      "2-4 fotky na mesiac",
      "Príprava do tlače",
    ],
    button: {
      label: "Objednať",
    },
  },
  {
    name: "Premium",
    price: 22,
    subtitle: "fotky + dátumy",
    badge: "Najobľúbenejší",
    description: "Všetko v Basic variante, plus označené meniny a narodeniny.",
    features: [
      "A3 nástenný kalendár",
      "Vlastné fotky",
      "Označené narodeniny",
      "Označené meniny",
      "Príprava do tlače",
    ],
    button: {
      label: "Objednať",
    },
  },
  {
    name: "Business",
    price: "dohodou",
    subtitle: "10+ ks",
    description:
      "Pre firmy, tímy alebo väčšie objednávky s jednotným dizajnom.",
    features: [
      "A3 nástenný kalendár",
      "Firemné fotky alebo tímové momenty",
      "Možnosť doplniť logo a firemné farby",
      "Všetko podľa dohody",
      "Príprava do tlače",
    ],
    button: {
      label: "Zistiť cenu",
    },
  },
];

export function PricingSection() {
  return (
    <section
      id="cennik"
      className="scroll-mt-24 mx-auto mt-8 max-w-6xl overflow-hidden rounded-xl bg-white px-2 py-12 text-primary shadow-2xl shadow-[#3E0F28]/20 border-[#EAD6DE] border-2"
    >
      <div className="mb-12 text-center">
        <Text
          variant="caption"
          className="text-sm font-extrabold uppercase tracking-[0.2em] text-secondary"
        >
          Cenník
        </Text>

        <Heading
          as="h2"
          className="mt-3 font-heading text-4xl font-bold tracking-tight md:text-5xl"
        >
          Vyberte si typ kalendára
        </Heading>
      </div>

      <div className="grid md:grid-cols-3 py-4">
        {plans.map((plan, index) => {
          const isPremium = plan.name === "Premium";

          return (
            <article
              key={plan.name}
              className={[
                "relative m-2 rounded-xl px-4 pb-6 pt-8 md:px-10",
                isPremium
                  ? "bg-[#FFF7F4] shadow-xl shadow-[#FC5A61]/10 ring-2 ring-[#FC5A61]"
                  : "bg-white",
              ].join(" ")}
            >
              {isPremium && (
                <Text className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-md bg-[#C8FF3D] px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#3E0F28] shadow-sm">
                  Najobľúbenejší
                </Text>
              )}

              <div
                className={[
                  "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm font-semibold",
                  isPremium
                    ? "border-[#FC5A61]/30 bg-white text-[#3E0F28]"
                    : "border-[#EAD6DE] bg-[#FFF7F4] text-[#7B5A6B]",
                ].join(" ")}
              >
                <Text
                  variant="small"
                  className="font-extrabold uppercase tracking-wide"
                >
                  {plan.name}
                </Text>
              </div>

              <div className="mt-6 flex items-end gap-1">
                <span className="pb-0.5 text-xl font-bold text-primary">
                  od
                </span>

                <span className="font-body font-bold leading-none tracking-tight text-primary md:text-7xl">
                  {plan.price}
                  {index !== 2 && <span className="ml-1 text-6xl">€</span>}
                </span>

                {index !== 2 && (
                  <span className="pb-1 pl-1 text-xl font-bold text-primary">
                    / ks
                  </span>
                )}
              </div>

              <Text variant="body" className="mt-3 font-medium">
                {plan.subtitle}
              </Text>

              <Button
                asChild
                size="lg"
                variant={isPremium ? "lime" : "default"}
                className="mt-10 w-full"
              >
                <Link href="/objednavka">{plan.button.label}</Link>
              </Button>

              <div className="mt-12">
                <Text className="font-extrabold leading-8">
                  {plan.description}
                </Text>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span
                        className={[
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-white mt-0.5",
                          isPremium ? "bg-[#FC5A61]" : "bg-secondary",
                        ].join(" ")}
                      >
                        <Check className="size-3 stroke-3" />
                      </span>

                      <Text>{feature}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
