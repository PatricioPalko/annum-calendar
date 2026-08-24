import Image from "next/image";
import Link from "next/link";

import { SectionLink } from "@/components/sections/navigation/section-link";
import { Button } from "@/components/ui/button";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";

const heroHighlights = [
  "Bez zložitého editora",
  "Darčekovo zabalené",
  "Obsahuje set na zavesenie",
] as const;

export function HeroSection() {
  return (
    <section className="relative mx-auto max-w-6xl py-4 sm:py-10">
      <div
        className="pointer-events-none absolute left-1/2 top-1 w-screen -translate-x-1/2 overflow-hidden sm:top-4"
        aria-hidden
      >
        <Image
          src="/line.svg"
          alt=""
          width={560}
          height={32}
          className="-ml-16 h-auto w-[34rem] max-w-none sm:-ml-24 sm:w-[46rem] lg:-ml-32 lg:w-[54rem]"
        />
      </div>

      <div className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
        <div className="relative">
          <SectionLabel>Kalendár spomienok</SectionLabel>

          <Heading as="h1" className="mt-3 max-w-xl">
            Vaše momenty
            <span className="relative mt-1 block text-secondary">
              po celý rok.
            </span>
          </Heading>

          <Text variant="lead" className="mt-6 max-w-lg text-primary/80">
            Premeňte chvíle, ku ktorým sa radi vraciate, na kalendár plný
            spoločných príbehov. Darujte spomienky, ktoré zostanú navždy.
          </Text>

          <ul className="mt-6 space-y-2.5">
            {heroHighlights.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm font-semibold text-primary/75"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full bg-secondary"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="lime" size="lg" asChild>
              <Link href="/objednavka">Vytvoriť spomienky</Link>
            </Button>

            <Button variant="secondary" size="lg" asChild>
              <SectionLink sectionId="ako-to-funguje">
                Ako to prebieha
              </SectionLink>
            </Button>
          </div>
        </div>

        <div className="relative lg:pt-4">
          <Image
            src="/hero1.webp"
            alt="Personalizovaný A3 kalendár spomienok pripravený na zavesenie"
            width={800}
            height={1000}
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="aspect-4/5 w-full object-contain object-center"
          />
        </div>
      </div>
    </section>
  );
}
