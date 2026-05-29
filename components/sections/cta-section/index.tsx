import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-xl bg-primary text-[#FFF7F4] shadow-2xl shadow-[#3E0F28]/20">
      <div className="relative px-6 py-10 md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#C8FF3D]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 size-40 rounded-full bg-[#FC5A61]/20 blur-3xl" />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Text variant="caption" className="text-sm text-lime">
              Jednoduché objednanie
            </Text>

            <Heading
              as="h2"
              className="mt-3 text-3xl font-bold leading-tight tracking-tight md:text-4xl text-white"
            >
              Nahrajte fotky,{" "}
              <span className="text-lime">o zvyšok sa postaráme.</span>
            </Heading>

            <Text
              variant="lead"
              className="mt-4 max-w-xl text-sm font-medium leading-6 text-[#FFF7F4]/75 md:text-base"
            >
              Vyberiete variant, počet kusov a nahráte fotky. Kalendár
              pripravíme tak, aby bol rovno pripravený na tlač.
            </Text>

            <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold text-[#FFF7F4]/80">
              <Text
                variant="caption"
                className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1 tracking-wide"
              >
                Bez zložitého editora
              </Text>
              <Text
                variant="caption"
                className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1 tracking-wide"
              >
                Vyznačené dátumy
              </Text>
              <Text
                variant="caption"
                className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1 tracking-wide"
              >
                Výhodné ponuky
              </Text>
            </div>
          </div>

          <Button variant="lime" size="lg" asChild className="w-full md:w-auto">
            <Link href="/objednavka">Vytvoriť kalendár</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
