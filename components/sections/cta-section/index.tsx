import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/ui/cta-band";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";
import Link from "next/link";

type CTASectionProps = {
  className?: string;
};

const ctaHighlights = [
  "Bez zložitého editora",
  "Darčekovo zabalené",
  "Obsahuje set na zavesenie",
] as const;

export function CTASection({ className }: CTASectionProps) {
  return (
    <section className={className}>
      <CtaBand
        className="mx-auto max-w-6xl"
        innerClassName="px-6 py-10 md:px-10 md:py-12"
      >
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <SectionLabel className="text-lime">Pripravení začať?</SectionLabel>

            <Heading as="h2" className="mt-3 text-white">
              Nahrajte fotky,{" "}
              <span className="text-lime">spomienky pripravíme za vás.</span>
            </Heading>

            <Text variant="lead" className="mt-4 max-w-xl text-[#FFF7F4]/85">
              Vyberte fotografie, ktoré vám vždy vyčaria úsmev. My z nich
              vytvoríme kalendár plný vašich spomienok, s láskou ho zabalíme a
              doručíme pripravený robiť radosť po celý rok.
            </Text>

            <ul className="mt-6 space-y-2">
              {ctaHighlights.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm font-semibold text-[#FFF7F4]/85"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-lime"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Button variant="lime" size="lg" asChild className="w-full md:w-auto">
            <Link href="/objednavka">Vytvoriť spomienky</Link>
          </Button>
        </div>
      </CtaBand>
    </section>
  );
}

export default CTASection;
