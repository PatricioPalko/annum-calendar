import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";

const galleryImages = [
  {
    src: "/detail3.png",
    alt: "Ukážka personalizovaného nástenného kalendára",
    label: "Finálny kalendár",
  },
  {
    src: "/detail4.png",
    alt: "Ukážka rozloženia fotiek v kalendári",
    label: "Až 4 fotky v jednom mesiaci",
  },
  {
    src: "/detail5.png",
    alt: "Ukážka vyznačených dátumov v kalendári",
    label: "Vyznačené dátumy",
  },
];

export function GallerySection() {
  const [mainImage, ...detailImages] = galleryImages;

  return (
    <section id="ukazka-kalendara" className="scroll-mt-24 bg-[#FFF7F4] py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-18 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Text variant="caption" as="span">
              Ukážka kalendára
            </Text>

            <Heading as="h2" className="mt-2">
              Takto môže vyzerať Váš kalendár
            </Heading>

            <Text variant="lead" className="mt-3">
              Nemusíte nič skladať v editore. Uploadnete fotky a my pripravíme
              kalendár tak, aby pôsobil čisto, osobne a bol pripravený na tlač.
            </Text>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.9fr] lg:items-center">
          <article className="relative">
            <div className="relative">
              <Text
                variant="caption"
                className="absolute left-3 bottom-4 z-10 rounded-md bg-lime px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-primary shadow-md sm:left-4 sm:bottom-20 sm:px-3.5 sm:text-xs"
              >
                {mainImage.label}
              </Text>

              <div className="relative min-h-105 sm:min-h-130 lg:min-h-160">
                <Image
                  src={mainImage.src}
                  alt={mainImage.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-contain"
                />
              </div>
            </div>
          </article>

          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
            {detailImages.map((image, index) => (
              <article key={image.src} className="relative">
                <Text
                  variant="caption"
                  className="absolute left-0 bottom-14 z-10 rounded-md bg-lime px-3.5 py-2 text-xs font-extrabold uppercase tracking-widest text-primary shadow-md"
                >
                  {image.label}
                </Text>

                <div className="relative min-h-45 sm:min-h-55 lg:min-h-62.5">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 28vw, (min-width: 640px) 33vw, 100vw"
                    className="object-contain"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <Button variant="default" size="lg" asChild>
            <Link href="/objednavka">Vytvoriť vlastný kalendár</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
