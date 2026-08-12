import { CalendarCheck, Images, MailCheck } from "lucide-react";

import { Heading, Text } from "@/components/ui/typography";

import { MIN_PHOTOS } from "@/lib/order/config";
const steps = [
  {
    icon: CalendarCheck,
    title: "Vyberiete typ kalendára",
    description:
      "Zvolíte variant, počet kusov a pri Premium verzii doplníte meniny alebo narodeniny, ktoré chcete zvýrazniť.",
  },
  {
    icon: Images,
    title: "Nahráte obľúbené fotky",
    description: `Nahráte minimálne ${MIN_PHOTOS} fotiek. Môžu byť na výšku aj na šírku — rozloženie prispôsobíme výslednému kalendáru.`,
  },
  {
    icon: MailCheck,
    title: "Pripravíme návrh",
    description:
      "Objednávku skontrolujeme, pripravíme kalendár z vašich podkladov a ozveme sa keď to bude pripravené.",
  },
];

export function AboutSection() {
  return (
    <section id="ako-to-funguje" className="scroll-mt-24 py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Text variant="caption" as="span">
            Objednávka krok za krokom
          </Text>

          <Heading as="h2" className="mt-2">
            Vlastný fotokalendár bez zložitého editora
          </Heading>

          {/* <Text className="mt-3">
            Vyberiete si typ kalendára, nahráte fotky a odošlete objednávku. My
            z Vašich podkladov pripravíme nástenný kalendár so špirálou.
          </Text> */}
          <Text variant="lead" className="mx-auto mt-4 max-w-2xl text-center">
            Vyberiete si typ kalendára, nahráte fotky a odošlete objednávku. My
            z Vašich podkladov pripravíme nástenný kalendár so špirálou — ku
            každej objednávke pridáme klinček a pero na poznámky.
          </Text>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="relative rounded-xl border border-[#EAD6DE] bg-white p-6 shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#FFF7F4] text-[#FC5A61]">
                    <Icon className="size-6" />
                  </div>

                  <span className="font-heading text-4xl font-bold text-soft">
                    0{index + 1}
                  </span>
                </div>

                <Heading
                  as="h3"
                  className="font-heading text-2xl font-bold text-[#3E0F28]"
                >
                  {step.title}
                </Heading>

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
