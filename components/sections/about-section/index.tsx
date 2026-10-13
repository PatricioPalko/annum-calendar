import { CalendarCheck, Images, MailCheck } from "lucide-react";
import Link from "next/link";

import { Heading, SectionLabel, Text } from "@/components/ui/typography";

import { MAX_PHOTOS, MIN_PHOTOS } from "@/lib/order/config";

const productFacts = [
  {
    term: "Formát",
    detail: "A3 nástenný fotokalendár, 13 strán a kovová väzba.",
  },
  {
    term: "Fotky",
    detail: `Od ${MIN_PHOTOS} do ${MAX_PHOTOS} vlastných fotiek, na výšku aj na šírku. Editor nepotrebujete.`,
  },
  {
    term: "Varianty",
    detail: "Basic, Premium s meninami a narodeninami, alebo Memory set.",
  },
] as const;

const steps = [
  {
    icon: CalendarCheck,
    title: "Poviete nám, aký kalendár pripravíme",
    description:
      "Zvolíte variant. Pri Premium a Memory set doplníte meniny alebo narodeniny, ktoré majú v kalendári vyniknúť.",
  },
  {
    icon: Images,
    title: "Pošlete obľúbené fotky",
    description: `Nahrajte minimálne ${MIN_PHOTOS} fotiek. Môžu byť na výšku aj na šírku — rozloženie prispôsobíme tak, aby spomienky vyzerali čo najlepšie.`,
  },
  {
    icon: MailCheck,
    title: "My pripravíme a pošleme",
    description:
      "Objednávku skontrolujeme, kalendár pripravíme z vašich podkladov, zabalíme a ozveme sa, keď bude pripravený na odoslanie alebo odber.",
  },
];

export function AboutSection() {
  return (
    <section id="ako-to-funguje" className="scroll-mt-32 py-8 sm:py-20">
      <div className="mx-auto max-w-6xl px-0 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Ako to prebieha</SectionLabel>

          <Heading as="h2" className="mt-2">
            Vytvorte si spomienky jednoducho
          </Heading>

          <Text variant="lead" className="mx-auto mt-4 max-w-2xl text-center">
            Annum je personalizovaný A3 fotokalendár z vašich fotiek. Vyberiete
            variant, nahráte fotky a odošlete objednávku. Rozloženie, tlač aj
            zabalenie pripravíme my.
          </Text>
        </div>

        <dl className="mx-auto mt-8 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
          {productFacts.map((fact) => (
            <div
              key={fact.term}
              className="rounded-xl border border-[#EAD6DE] bg-white px-4 py-3"
            >
              <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#FC5A61]">
                {fact.term}
              </dt>
              <dd className="mt-1 text-sm font-semibold leading-6 text-[#3E0F28]/80">
                {fact.detail}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-center text-sm font-bold text-[#3E0F28]/75">
          <Link
            href="/#cennik"
            className="rounded-sm underline-offset-4 hover:text-[#FC5A61] hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FC5A61]/30"
          >
            Cenník fotokalendára
          </Link>
          <span aria-hidden="true" className="px-2 text-[#3E0F28]/35">
            ·
          </span>
          <Link
            href="/objednavka"
            className="rounded-sm underline-offset-4 hover:text-[#FC5A61] hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FC5A61]/30"
          >
            Objednať fotokalendár z vlastných fotiek
          </Link>
        </p>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="relative rounded-xl border border-[#EAD6DE] bg-white p-4 shadow-md sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between sm:mb-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF7F4] text-[#FC5A61] sm:size-12">
                    <Icon className="size-5 sm:size-6" aria-hidden />
                  </div>

                  <span className="font-heading text-2xl font-bold text-soft sm:text-4xl">
                    0{index + 1}
                  </span>
                </div>

                <Heading as="h3">{step.title}</Heading>

                <Text variant="body" className="mt-3 font-medium">
                  {step.description}
                </Text>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
