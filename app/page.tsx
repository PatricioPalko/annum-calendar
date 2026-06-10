import { AboutSection } from "@/components/sections/about-section";
import CTASection from "@/components/sections/cta-section";
import FaqSection from "@/components/sections/faq-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import Image from "next/image";
import Link from "next/link";

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
    lowPrice: "15",
    highPrice: "78",
    availability: "https://schema.org/InStock",
    url: "https://www.annum.sk/#cennik",
  },
};

export default function Home() {
  return (
    <>
      <JsonLd data={productJsonLd} />
      <main
        className={`font-body min-h-screen bg-[#FFF7F4] p-6 text-[#3E0F28]`}
      >
        <section className="mx-auto max-w-6xl px-6 py-8">
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

              <Text
                variant="lead"
                className="mt-6 max-w-xl text-lg leading-8 text-primary"
              >
                Personalizovaný kalendár z vašich fotiek, narodenín a menín —
                pripravený jednoducho, bez zložitého editora.
              </Text>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/objednavka">Vytvoriť kalendár</Link>
                </Button>

                <Button variant="secondary" size="lg" asChild>
                  <Link href="#pricing">Pozrieť cenník</Link>
                </Button>
              </div>
            </div>

            <div className="relative ">
              <Image
                src="/calendar5.png"
                alt="Ukážka personalizovaného A3 kalendára"
                width={800}
                height={1000}
                priority
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
