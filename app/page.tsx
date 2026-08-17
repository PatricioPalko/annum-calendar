import { calendarTypes, getLowestUnitPrice } from "@/app/types/types";
import { AboutSection } from "@/components/sections/about-section";
import CTASection from "@/components/sections/cta-section";
import FaqSection from "@/components/sections/faq-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { SectionLink } from "@/components/sections/navigation/section-link";
import { PricingSection } from "@/components/sections/pricing-section";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Annum | Personalizované A3 nástenné kalendáre z fotiek",
    description:
      "Personalizovaný A3 nástenný kalendár z vašich fotiek. Jednoduchá konfigurácia, až 52 fotiek, Premium variant s meninami a narodeninami.",
    url: "https://www.annum.sk",
  },
};

const lowestUnitPrice = Math.min(
  ...calendarTypes
    .map((plan) => getLowestUnitPrice(plan))
    .filter((price): price is number => price !== null),
);
const highestListedPackPrice = Math.max(
  ...calendarTypes.flatMap((plan) => Object.values(plan.prices)),
);

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Personalizovaný A3 nástenný kalendár",
  brand: {
    "@type": "Brand",
    name: "Annum",
  },
  description:
    "Personalizovaný A3 nástenný kalendár s kovovou väzbou z vlastných fotiek. Premium variant umožňuje vyznačiť meniny a narodeniny.",
  image: "https://www.annum.sk/og-image.jpg",
  category: "Personalizované fotoprodukty",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: String(lowestUnitPrice),
    highPrice: String(highestListedPackPrice),
    availability: "https://schema.org/InStock",
    url: "https://www.annum.sk/#cennik",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Annum",
  url: "https://www.annum.sk",
  logo: "https://www.annum.sk/icon-512.png",
  email: "info@annum.sk",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Annum",
  url: "https://www.annum.sk",
  inLanguage: "sk-SK",
  publisher: {
    "@type": "Organization",
    name: "Annum",
  },
};

export default function Home() {
  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <main
        id="main-content"
        className="font-body min-h-screen bg-[#FFF7F4] px-4 py-6 text-[#3E0F28] sm:px-6"
      >
        <section className="mx-auto max-w-6xl py-4 sm:py-8">
          <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-center">
            <div>
              {/* <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#EAD6DE] bg-[#FFF7F4] px-4 py-2 text-sm font-semibold text-[#7B5A6B]">
              <span className="size-2 rounded-full bg-[#C8FF3D]" />
              Annum · personalizované A3 kalendáre
            </div> */}

              {/* <h1
              className={`font-heading max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight text-[#3E0F28] md:text-7xl`}
            >
              Vaše momenty
              <span className="block text-[#FC5A61]">po celý rok.</span>
            </h1> */}
              <Heading as="h1">
                Vaše momenty
                <span className="block text-secondary">po celý rok.</span>
              </Heading>

              <Text variant="lead" className="mt-6 max-w-xl">
                Personalizovaný kalendár z vašich fotiek, narodenín a menín —
                pripravený jednoducho, bez zložitého editora.
              </Text>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/objednavka">Vytvoriť kalendár</Link>
                </Button>

                <Button variant="secondary" size="lg" asChild>
                  <SectionLink sectionId="cennik">Pozrieť cenník</SectionLink>
                </Button>
              </div>
            </div>

            <div className="relative ">
              <Image
                src="/hero1.webp"
                alt="Ukážka personalizovaného A3 kalendára"
                width={800}
                height={1000}
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="aspect-4/5 w-full object-contain object-center"
              />

              {/* <div className="absolute right-6 bottom-6 rounded-full bg-[#C8FF3D] px-4 py-2 text-sm font-extrabold text-[#3E0F28] shadow-sm">
              od 25 €
            </div>

            <div className="absolute bottom-6 left-6 rounded-full bg-[#FC5A61] px-4 py-2 text-sm font-bold text-white shadow-sm">
              A3 · na stenu
            </div> */}
            </div>
          </div>
        </section>
        <AboutSection />
        <GallerySection />
        <PricingSection />
        <FaqSection />
        <CTASection />
      </main>
    </>
  );
}
