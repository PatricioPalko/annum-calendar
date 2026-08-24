import {
  getBasicLowestUnitPrice,
  getConsumerHighestPackPrice,
} from "@/app/types/types";
import { AboutSection } from "@/components/sections/about-section";
import CTASection from "@/components/sections/cta-section";
import FaqSection from "@/components/sections/faq-section";
import { ForWhomSection } from "@/components/sections/for-whom-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { HeroSection } from "@/components/sections/hero-section";
import { DeliveryWavesSection } from "@/components/sections/delivery-waves-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { JsonLd } from "@/components/seo/json-ld";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Annum | Spomienky z vašich fotiek celý rok",
    description:
      "Personalizovaný A3 fotokalendár pripravený zavesiť. Nahrajte fotky, my pripravíme kalendár spomienok — s meninami a narodeninami, pekne zabalený, bez zložitého editora.",
    url: "https://www.annum.sk",
  },
};

const lowestUnitPrice = getBasicLowestUnitPrice();
const highestListedPackPrice = getConsumerHighestPackPrice();

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Personalizovaný A3 nástenný kalendár",
  brand: {
    "@type": "Brand",
    name: "Annum",
  },
  description:
    "Kalendár spomienok z vašich fotiek. A3 nástenný kalendár s kovovou väzbou, pripravený zavesiť. Premium variant umožňuje vyznačiť meniny a narodeniny.",
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
  legalName: "LAETAS s. r. o.",
  url: "https://www.annum.sk",
  logo: "https://www.annum.sk/icon-512.png",
  email: "info@annum.sk",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Trnavská 664/16",
    addressLocality: "Košice",
    postalCode: "040 01",
    addressCountry: "SK",
  },
  taxID: "57810133",
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
        <HeroSection />
        <ForWhomSection />
        <CTASection className="mt-8" />
        <AboutSection />
        <GallerySection />
        <PricingSection />
        <DeliveryWavesSection />
        <FaqSection />
      </main>
    </>
  );
}
