import {
  getLowestUnitPrice,
  orderableCalendarTypes,
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
import {
  createPageMetadata,
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

const fromPrices = orderableCalendarTypes
  .map((plan) => getLowestUnitPrice(plan))
  .filter((price): price is number => price !== null);

if (fromPrices.length === 0) {
  throw new Error("Missing calendar prices for product structured data.");
}

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Personalizovaný A3 fotokalendár",
  brand: {
    "@type": "Brand",
    name: SITE_NAME,
  },
  description:
    "A3 nástenný fotokalendár z vlastných fotiek s kovovou väzbou. 13 strán, príprava a zabalenie v cene. Varianty Basic, Premium s meninami a narodeninami a Memory set.",
  image: `${SITE_URL}/og-image.jpg`,
  category: "Fotokalendáre",
  url: SITE_URL,
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: Math.min(...fromPrices),
    highPrice: Math.max(...fromPrices),
    offerCount: orderableCalendarTypes.length,
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}/#cennik`,
    seller: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  legalName: "LAETAS s. r. o.",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  email: "info@annum.sk",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Trnavská 664/16",
    addressLocality: "Košice",
    postalCode: "040 01",
    addressCountry: "SK",
  },
  taxID: "57810133",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "info@annum.sk",
    availableLanguage: ["Slovak"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "sk-SK",
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
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
