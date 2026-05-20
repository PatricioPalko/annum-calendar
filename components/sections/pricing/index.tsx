import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Basic",
    price: 25,
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
    price: 32,
    subtitle: "fotky + dátumy",
    description:
      "Všetko v Basic variante, plus označené meniny, narodeniny a výročia.",
    features: [
      "A3 nástenný kalendár",
      "Vlastné fotky",
      "Označené narodeniny",
      "Označené meniny",
      "Možnosť pridať výročia",
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
      "Všetko podľa dohody",
      "Firemné fotky alebo tímové momenty",
      "Možnosť doplniť logo a firemné farby",
      "Väčší počet rovnakých kusov",
      "Individuálna cena podľa množstva",
      "Vhodné ako darček pre klientov alebo zamestnancov",
    ],
    button: {
      label: "Zistiť cenu",
    },
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-xl bg-white px-2 py-12 text-primary shadow-2xl shadow-[#3E0F28]/20 border-[#EAD6DE] border-2"
    >
      <div className="mb-12 text-center">
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-secondary">
          Cenník
        </p>

        <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight md:text-5xl">
          Vyberte si variant kalendára
        </h2>
      </div>

      <div className="grid md:grid-cols-3 py-4">
        {plans.map((plan, index) => (
          <article
            key={plan.name}
            className={[
              "px-2 md:px-10 m-2",
              index === 1
                ? "border-y border-[#EAD6DE]/35 md:border-x-2 md:border-y-0"
                : "",
            ].join(" ")}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#EAD6DE] bg-[#FFF7F4] px-4 py-2 text-sm font-semibold text-[#7B5A6B]">
              <h3 className="font-extrabold uppercase">{plan.name}</h3>
            </div>
            <div className="mt-6 flex items-end gap-3">
              <span className="font-body font-extrabold leading-none md:text-7xl text-primary tracking-tight">
                {plan.price}
                {index !== 2 && <span className="text-6xl ml-1">€</span>}
              </span>
              {index !== 2 && (
                <span className="pb-1 text-xl font-bold text-[#D8C2CF]">
                  / 1 ks
                </span>
              )}
            </div>

            <p className="mt-3 font-medium">{plan.subtitle}</p>

            <Button asChild size="lg" className="mt-10 w-full">
              <Link href="/objednavka">{plan.button.label}</Link>
            </Button>

            <div className="mt-12">
              <p className="font-extrabold leading-8">{plan.description}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-4">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                      <Check className="size-3 stroke-3" />
                    </span>

                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-md border border-[#FFF7F4]/15 bg-white/5 p-5 text-sm leading-6 text-[#D8C2CF]">
        Ceny sú pre 1 kus. Pri 3 ks, 5 ks alebo inom počte rovnakých kalendárov
        sa cena zvýhodní podľa počtu výtlačkov.
      </div>
    </section>
  );
}
