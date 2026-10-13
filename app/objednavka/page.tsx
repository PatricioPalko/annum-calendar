import OrderForm from "@/components/sections/order-form";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = createPageMetadata({
  title: "Objednať fotokalendár",
  description:
    "Objednajte personalizovaný A3 fotokalendár z vlastných fotiek. Vyberte Basic, Premium alebo Memory set, nahrajte fotky a dokončite objednávku online.",
  path: "/objednavka",
});

export default function KalendarPage() {
  return (
    <main
      id="main-content"
      className="font-body min-h-screen bg-[#FFF7F4] px-4 pb-24 text-[#3E0F28] sm:px-6 lg:pb-12"
    >
      <div className="mx-auto max-w-6xl pt-6 sm:pt-8">
        <Breadcrumbs
          items={[
            { name: "Domov", path: "/" },
            { name: "Objednávka", path: "/objednavka" },
          ]}
        />
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
                Objednajte personalizovaný A3 fotokalendár z vlastných fotiek.
                Vyberte variant, nahrajte fotky a doplňte doručenie. Pri Premium
                a Memory set doplníte aj dôležité dátumy.
              </Text>
            </div>

            <div className="relative mx-auto hidden w-full max-w-xs sm:block lg:mx-0 lg:max-w-none lg:justify-self-end">
              <Image
                src="/detail2.webp"
                alt="Ukážka personalizovaného A3 fotokalendára z vlastných fotiek"
                width={640}
                height={720}
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 100vw"
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
