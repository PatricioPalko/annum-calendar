import { Briefcase, Heart, Home, Users } from "lucide-react";
import Link from "next/link";

import { Heading, SectionLabel, Text } from "@/components/ui/typography";

const audiences = [
  {
    icon: Heart,
    title: "Pre rodičov a starých rodičov",
    description: "Každý mesiac iná spomienka — fotky, ktoré radi uvidia celý rok.",
  },
  {
    icon: Home,
    title: "Pre partnera a rodinu",
    description: "Rok Vášho spoločného príbehu na jednom mieste, pripravený zavesiť.",
  },
  {
    icon: Users,
    title: "Pre celú rodinu a blízkych",
    description: "Deti, vnúčatá, rodina a spoločné chvíle rozložené v jednotlivých mesiacoch.",
  },
  {
    icon: Briefcase,
    title: "Pre firmy od 10 ks",
    description: "Kalendáre pre tím alebo klientov — nezáväzná ponuka na mieru.",
    href: "/pre-firmy" as const,
  },
] as const;

export function ForWhomSection() {
  return (
    <section id="pre-koho" className="scroll-mt-24 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white px-4 py-10 shadow-sm ring-1 ring-[#EAD6DE]/80 sm:px-6 sm:py-12 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Pre koho</SectionLabel>

          <Heading as="h2" className="mt-2">
            Spomienky, ktoré dávajú zmysel práve Vám
          </Heading>

          <Text variant="lead" className="mx-auto mt-4 max-w-2xl text-center">
            Nenechajte najkrajšie fotky zapadnúť medzi tisíckami záberov v
            mobile. Premeňte ich na spomienky, ktoré budete mať na očiach každý
            deň — pre seba alebo ako darček pre niekoho blízkeho.
          </Text>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="flex h-full flex-col rounded-xl bg-[#FFF7F4] p-5 sm:p-6"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-white text-[#FC5A61] ring-1 ring-[#EAD6DE]/80">
                  <Icon className="size-[18px]" aria-hidden />
                </div>

                <Heading as="h3" className="text-lg leading-snug">
                  {item.title}
                </Heading>

                <Text variant="body" className="mt-2 grow leading-relaxed">
                  {item.description}
                </Text>

                {"href" in item ? (
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex items-center text-sm font-bold text-[#FC5A61] underline-offset-4 transition hover:underline"
                  >
                    Nezáväzná ponuka →
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
