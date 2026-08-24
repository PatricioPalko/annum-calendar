import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { showcaseLabelClassName } from "@/components/ui/recommended-badge";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";
import { ORDER_SHARED_INCLUSIONS } from "@/lib/order/config";
import { cn } from "@/lib/utils";


const heroShowcase = {
  src: "/detail2.webp",
  alt: "Ukážka titulnej strany personalizovaného kalendára spomienok",
  label: "Titulná strana — prvý dojem",
};

const layoutExamples = [
  {
    src: "/detail3.webp",
    alt: "Ukážka mesiaca so štyrmi fotkami",
    label: "Až 4 fotky na jeden mesiac",
  },
  {
    src: "/detail4.webp",
    alt: "Ukážka mesiaca s kombinovaným rozložením",
    label: "Až 10 rozličných rozložení fotiek",
  },
  {
    src: "/hero1.webp",
    alt: "A3 kalendár spomienok pripravený na zavesenie",
    label: "Celý rok na jednom mieste",
  },
] as const;

const premiumHighlight = {
  src: "/detail5.webp",
  alt: "Ukážka vyznačených menín a narodenín v kalendári",
  title: "Aby ste na dôležitý deň nezabudli",
  description:
    "Pri Premium variante doplníte meniny a narodeniny - v kalendári budú meniny zvýraznené zelenou farbou a narodeniny s menom a ikonou darčeka pri určenom dátume.",
};

type ShowcaseFigureProps = {
  src: string;
  alt: string;
  label: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  compactPadding?: boolean;
  roundedClassName?: string;
};

function ShowcaseFigure({
  src,
  alt,
  label,
  className,
  imageClassName,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority = false,
  compactPadding = false,
  roundedClassName = "rounded-lg",
}: ShowcaseFigureProps) {
  return (
    <figure className={cn("group relative", className)}>
      <div
        className={cn(
          "relative overflow-hidden",
          roundedClassName,
          imageClassName,
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn(
            "object-contain transition-transform duration-500 group-hover:scale-[1.015]",
            compactPadding ? "p-0" : "p-0 sm:p-1",
          )}
        />
      </div>

      <figcaption className="absolute bottom-3 left-3 z-10 sm:bottom-4 sm:left-4">
        <span className={showcaseLabelClassName}>{label}</span>
      </figcaption>
    </figure>
  );
}

export function GallerySection() {
  return (
    <section
      id="ukazka-kalendara"
      className="scroll-mt-24 bg-[#FFF7F4] py-10 sm:py-14"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] lg:gap-8 xl:gap-10">
          <div
            id="co-je-v-baleni"
            className="scroll-mt-24 max-w-3xl lg:max-w-none lg:pr-2 xl:pr-4"
          >
            <SectionLabel>Čo je v balení</SectionLabel>

            <Heading as="h2" className="mt-2">
              Nemusíte nič riešiť — stačí len poslať fotky
            </Heading>

            <Text variant="lead" className="mt-4 max-w-xl">
              V cene je príprava kalendára, tlač, zabalenie a set na zavesenie.
            </Text>

            <ul className="mt-6 space-y-3">
              {ORDER_SHARED_INCLUSIONS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#3E0F28]/85 sm:text-base"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FC5A61] text-white">
                    <Check className="size-3 stroke-3" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <ShowcaseFigure
            src={heroShowcase.src}
            alt={heroShowcase.alt}
            label={heroShowcase.label}
            priority
            sizes="(min-width: 1024px) 62vw, 100vw"
            imageClassName="min-h-96 sm:min-h-[26rem] lg:min-h-[34rem] xl:min-h-[38rem]"
            className="lg:-mr-4 xl:-mr-8"
            roundedClassName="rounded-2xl"
          />
        </div>

        <div className="mt-24 sm:mt-28 lg:mt-36">
          <div className="mx-auto max-w-2xl text-center">
            <Heading as="h3" className="text-xl sm:text-2xl">
              Každý mesiac iná spomienka
            </Heading>
            <Text variant="lead" className="mx-auto mt-2">
              Podľa počtu a formátu fotiek pripravíme prehľadné rozloženie — od
              jednej dominantnej fotky až po koláž viacerých snímok.
            </Text>
          </div>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
            {layoutExamples.map((example) => (
              <ShowcaseFigure
                key={example.src}
                src={example.src}
                alt={example.alt}
                label={example.label}
                roundedClassName="rounded-xl"
                compactPadding
                imageClassName="min-h-80 sm:min-h-96 lg:min-h-[26rem] xl:min-h-[28rem]"
              />
            ))}
          </div>
        </div>

        <div className="mt-10 grid items-center gap-6 sm:mt-12 lg:mt-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
          <figure className="group relative overflow-hidden rounded-xl">
            <div className="relative min-h-72 sm:min-h-80 lg:min-h-[26rem] xl:min-h-[28rem]">
              <Image
                src={premiumHighlight.src}
                alt={premiumHighlight.alt}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-contain p-1 sm:p-2"
              />
            </div>
            <figcaption className="absolute bottom-[12%] left-1/2 z-10 -translate-x-1/2 sm:bottom-[14%]">
              <span className="inline-flex rounded-md bg-[#FC5A61] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-md sm:text-xs">
                Premium
              </span>
            </figcaption>
          </figure>

          <div className="max-w-md">
            <SectionLabel>Premium</SectionLabel>
            <Heading as="h3" className="mt-2 text-lg sm:text-xl">
              {premiumHighlight.title}
            </Heading>
            <Text variant="body" className="mt-2">
              {premiumHighlight.description}
            </Text>
            <Button variant="default" size="default" asChild className="mt-5 w-full sm:w-auto">
              <Link href="/objednavka">Objednať Premium</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
