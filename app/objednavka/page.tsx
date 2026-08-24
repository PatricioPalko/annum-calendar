import OrderForm from "@/components/sections/order-form";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Vytvoriť spomienky",
  description:
    "Vytvorte si personalizovaný A3 fotokalendár spomienok za pár minút. Vyberte variant, nahrajte fotky, doplňte meniny alebo narodeniny a dokončite objednávku online.",
  alternates: {
    canonical: "/objednavka",
  },
  openGraph: {
    title: "Vytvoriť spomienky | Annum",
    description:
      "Nahrajte fotky a my pripravíme personalizovaný A3 kalendár spomienok — pekne zabalený, pripravený zavesiť. Vyberte typ, počet kusov a doručenie cez Packetu.",
    url: "https://www.annum.sk/objednavka",
  },
};

export default function KalendarPage() {
  return (
    <main
      id="main-content"
      className="font-body min-h-screen bg-[#FFF7F4] px-4 pb-24 text-[#3E0F28] sm:px-6 lg:pb-12"
    >
      <div className="mx-auto max-w-6xl pt-6 sm:pt-8">
        <header className="mb-6 sm:mb-8">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] lg:gap-8">
            <div className="max-w-2xl">
              <SectionLabel>Objednávka</SectionLabel>

              <Heading as="h1" className="mt-1 text-3xl sm:text-4xl">
                Vytvorte spomienky
                <span className="block text-secondary">za pár minút</span>
              </Heading>

              <Text
                variant="lead"
                className="mt-3 text-sm leading-relaxed sm:text-base"
              >
                Vyberte variant, nahrajte fotky a doplňte doručenie. Set na
                zavesenie je v cene — pri Premium aj dôležité dátumy.
              </Text>
            </div>

            <div className="relative mx-auto hidden w-full max-w-xs sm:block lg:mx-0 lg:max-w-none lg:justify-self-end">
              <Image
                src="/detail2.webp"
                alt="Ukážka personalizovaného kalendára spomienok"
                width={640}
                height={720}
                priority
                sizes="(min-width: 1024px) 32vw, (min-width: 640px) 40vw, 100vw"
                className="aspect-4/5 w-full object-contain object-center"
              />
            </div>
          </div>
        </header>

        <OrderForm />
      </div>
    </main>
  );
}
