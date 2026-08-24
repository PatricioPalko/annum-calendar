import { CalendarCheck, Images, MailCheck } from "lucide-react";

import { Heading, SectionLabel, Text } from "@/components/ui/typography";

import {
  MIN_PHOTOS,
  ORDER_HANGING_SET_DETAILS,
  ORDER_HANGING_SET_LABEL,
} from "@/lib/order/config";

const steps = [
  {
    icon: CalendarCheck,
    title: "Poviete nám, aký kalendár pripravíme",
    description:
      "Zvolíte variant a pri Premium verzii doplníte meniny alebo narodeniny, ktoré majú v kalendári vyniknúť.",
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
    <section id="ako-to-funguje" className="scroll-mt-24 py-8 sm:py-20">
      <div className="mx-auto max-w-6xl px-0 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Ako to prebieha</SectionLabel>

          <Heading as="h2" className="mt-2">
            Vytvorte si spomienky jednoducho
          </Heading>

          <Text variant="lead" className="mx-auto mt-4 max-w-2xl text-center">
            Vyberiete variant, nahrajete fotky a odošlete objednávku. My z
            vašich podkladov pripravíme nástenný kalendár so špirálou — ku
            každej objednávke pridáme {ORDER_HANGING_SET_LABEL.toLowerCase()}{" "}
            ({ORDER_HANGING_SET_DETAILS}).
          </Text>
        </div>

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
                    <Icon className="size-5 sm:size-6" />
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
