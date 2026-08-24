import Link from "next/link";

import { BusinessInquiryForm } from "@/components/sections/business-inquiry-form";
import { Button } from "@/components/ui/button";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pre firmy",
  description:
    "Nezáväzná ponuka na personalizované A3 kalendáre pre firmy od 10 kusov. Logo, firemné fotky a individuálna príprava.",
  alternates: {
    canonical: "/pre-firmy",
  },
  openGraph: {
    title: "Pre firmy | Annum",
    description:
      "Kalendáre pre tím, klientov alebo partnerov od 10 kusov. Pošlite dopyt a pripravíme ponuku na mieru.",
    url: "https://www.annum.sk/pre-firmy",
  },
};

const highlights = [
  "Rovnaké kalendáre pre tím, klientov alebo partnerov",
  "Logo, firemné fotky a úpravy podľa dohody",
  "Individuálna príprava a komunikácia pred tlačou",
  "Možnosť fakturácie a termínu podľa vašich potrieb",
] as const;

export default function PreFirmyPage() {
  return (
    <main
      id="main-content"
      className="font-body min-h-screen bg-[#FFF7F4] px-4 py-6 text-[#3E0F28] sm:px-6"
    >
      <section className="mx-auto max-w-5xl py-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
          <div>
            <SectionLabel>Pre firmy</SectionLabel>

            <Heading as="h1" className="mt-2">
              Kalendáre pre tím od 10 kusov
            </Heading>

            <Text variant="lead" className="mt-4 max-w-xl">
              Online objednávka je určená pre jednotlivcov a rodinné objednávky.
              Pre firmy pripravíme nezáväznú ponuku s cenou, termínom a prípravou
              na mieru.
            </Text>

            <ul className="mt-6 space-y-3">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="text-sm font-semibold leading-6 text-[#3E0F28]/80 sm:text-base"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="secondary" asChild>
                <Link href="/objednavka">Objednávka pre jednotlivcov</Link>
              </Button>
              <Button variant="lime" asChild>
                <Link href="/#cennik">Pozrieť cenník Basic & Premium</Link>
              </Button>
            </div>
          </div>

          <BusinessInquiryForm />
        </div>
      </section>
    </main>
  );
}
