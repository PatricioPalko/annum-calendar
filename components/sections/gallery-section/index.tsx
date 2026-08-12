import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const finalProduct = {
  src: "/final.webp",
  alt: "Finálny nástenný A3 kalendár s kovovou väzbou",
  label: "Finálny kalendár",
};

const layoutExamples = [
  {
    src: "/detail3.png",
    alt: "Ukážka mesiaca s jednou dominantnou fotkou",
    label: "1 hlavná fotka",
  },
  {
    src: "/detail4.png",
    alt: "Ukážka mesiaca so štyrmi fotkami",
    label: "Až 4 fotky",
  },
  {
    src: "/f10.png",
    alt: "Ukážka mesiaca s kombinovaným rozložením",
    label: "Kombinované rozloženie",
  },
] as const;

const premiumHighlight = {
  src: "/detail5.png",
  alt: "Ukážka vyznačených menín a narodenín v kalendári",
  title: "Vyznačené meniny a narodeniny",
  description:
    "Pri Premium variante ich doplníte v objednávke — v kalendári uvidíte pri dátume prehľadne.",
};

type ShowcaseFigureProps = {
  src: string;
  alt: string;
  label: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  framed?: boolean;
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
  framed = true,
  compactPadding = false,
  roundedClassName = "rounded-lg",
}: ShowcaseFigureProps) {
  return (
    <figure className={cn("group relative", className)}>
      <div
        className={cn(
          "relative overflow-hidden",
          roundedClassName,
          framed &&
            "bg-white/70 shadow-lg shadow-[#3E0F28]/8 ring-1 ring-[#EAD6DE]/80",
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
            compactPadding ? "p-0 sm:p-1" : "p-3 sm:p-5",
          )}
        />
      </div>

      <figcaption className="absolute bottom-3 left-3 z-10 sm:bottom-4 sm:left-4">
        <span className="inline-flex rounded-md bg-lime px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary shadow-md sm:px-3.5 sm:text-xs">
          {label}
        </span>
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
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:gap-8 xl:gap-10">
          <div className="max-w-3xl lg:max-w-none lg:pr-2 xl:pr-4">
            <SectionLabel>Ukážka kalendára</SectionLabel>

            <Heading as="h2" className="mt-2">
              Takto môže vyzerať Váš kalendár
            </Heading>

            <Text variant="lead" className="mt-3">
              Uploadnete fotky a my pripravíme kalendár — bez editora, pripravený
              na tlač.
            </Text>
          </div>

          <ShowcaseFigure
            src={finalProduct.src}
            alt={finalProduct.alt}
            label={finalProduct.label}
            priority
            framed={false}
            compactPadding
            sizes="(min-width: 1024px) 62vw, 100vw"
            imageClassName="min-h-96 sm:min-h-[26rem] lg:min-h-[34rem] xl:min-h-[38rem]"
            className="lg:-mr-4 xl:-mr-8"
            roundedClassName="rounded-md"
          />
        </div>

        <div className="mt-24 sm:mt-28 lg:mt-36">
          <div className="mx-auto max-w-2xl text-center">
            <Heading as="h3" className="text-xl sm:text-2xl">
              Rozloženie fotiek v mesiaci
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
                framed={false}
                roundedClassName="rounded-md"
                compactPadding
                imageClassName="min-h-80 sm:min-h-96 lg:min-h-[26rem] xl:min-h-[28rem]"
              />
            ))}
          </div>
        </div>

        <div className="mt-10 grid items-center gap-6 sm:mt-12 lg:mt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
          <figure className="group relative">
            <div className="relative min-h-56 sm:min-h-64 lg:min-h-72">
              <Image
                src={premiumHighlight.src}
                alt={premiumHighlight.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain p-2 sm:p-4"
              />
            </div>
            <figcaption className="absolute bottom-[12%] left-1/2 z-10 -translate-x-1/2 sm:bottom-[14%]">
              <span className="inline-flex rounded-md bg-lime px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary shadow-md sm:text-xs">
                Premium
              </span>
            </figcaption>
          </figure>

          <div className="max-w-md">
            <SectionLabel>Premium</SectionLabel>
            <Heading as="h3" className="mt-2 text-lg sm:text-xl">
              {premiumHighlight.title}
            </Heading>
            <Text className="mt-2">{premiumHighlight.description}</Text>
          </div>
        </div>

        <div className="mt-8 flex justify-center sm:mt-10">
          <Button variant="default" size="lg" asChild className="w-full sm:w-auto">
            <Link href="/objednavka">Vytvoriť vlastný kalendár</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
