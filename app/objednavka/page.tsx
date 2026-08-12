import OrderForm from "@/components/sections/order-form";
import { Heading, Text } from "@/components/ui/typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Objednávka",
  description:
    "Vytvorte si personalizovaný A3 nástenný kalendár z fotiek. Vyberte variant, nahrajte fotky, doplňte meniny alebo narodeniny a dokončite objednávku online.",
  alternates: {
    canonical: "/objednavka",
  },
  openGraph: {
    title: "Objednávka kalendára | Annum",
    description:
      "Konfigurátor personalizovaného A3 kalendára. Vyberte typ, počet kusov, nahrajte fotky a objednajte s doručením cez Packetu alebo osobným odberom v Košiciach.",
    url: "https://www.annum.sk/objednavka",
  },
};

export default function KalendarPage() {
  return (
    <main
      id="main-content"
      className="font-body min-h-screen bg-[#FFF7F4] px-4 py-6 text-[#3E0F28] sm:px-6"
    >
      <section className="mx-auto max-w-7xl py-8 sm:py-12">
        <div>
            <Heading as="h1">
              Vytvor si kalendár
              <span className="block text-secondary">jednoducho a rýchlo</span>
            </Heading>

            <Text variant="lead" className="mt-6 max-w-xl">
              Vyber typ kalendára, počet kusov a nahraj fotky. Pri Premium
              variante môžeš doplniť aj narodeniny, meniny alebo výročia. Ku
              každej objednávke patrí klinček a pero na poznámky.
              <span className="block font-semibold text-secondary">
                {" "}
                Všetko ostatné nechaj na nás.
              </span>
            </Text>
          </div>
      </section>
      <div className="relative block">
        <OrderForm />
      </div>
    </main>
  );
}
