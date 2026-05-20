import { PricingSection } from "@/components/sections/pricing";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className={`font-body min-h-screen bg-[#FFF7F4] p-6 text-[#3E0F28]`}>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center">
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

            <p className="mt-6 max-w-xl text-lg leading-8 text-primary">
              Personalizovaný kalendár z vašich fotiek, narodenín a menín —
              pripravený jednoducho, bez zložitého editora.
            </p>

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
              src="/f10.png"
              alt="Ukážka personalizovaného A3 kalendára"
              width={700}
              height={900}
              priority
              className="aspect-4/5 w-full rounded-[1.1rem] object-contain object-center"
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
      <PricingSection />

      <section className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-xl bg-primary text-[#FFF7F4] shadow-2xl shadow-[#3E0F28]/20">
        <div className="relative px-6 py-10 md:px-10 md:py-12">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#C8FF3D]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 size-40 rounded-full bg-[#FC5A61]/20 blur-3xl" />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-[#C8FF3D]">
                Jednoduché objednanie
              </p>

              <h2 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                Nahrajte fotky,{" "}
                <span className="text-lime">o zvyšok sa postaráme.</span>
              </h2>

              <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-[#FFF7F4]/75 md:text-base">
                Vyberiete variant, počet kusov a nahráte fotky. Kalendár
                pripravíme tak, aby bol rovno pripravený na tlač.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold text-[#FFF7F4]/80">
                <span className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1">
                  Bez zložitého editora
                </span>
                <span className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1">
                  Vyznačené dátumy
                </span>
                <span className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1">
                  Výhodné ponuky
                </span>
              </div>
            </div>

            <Button
              variant="lime"
              size="lg"
              asChild
              className="w-full md:w-auto"
            >
              <Link href="/objednavka">Vytvoriť kalendár</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
