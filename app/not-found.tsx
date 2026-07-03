import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stránka nenájdená",
  description: "Požadovaná stránka neexistuje alebo bola presunutá.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center bg-[#FFF7F4] px-4 py-16 text-[#3E0F28] sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 text-center shadow-xl shadow-[#3E0F28]/10 sm:p-10">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]">
          Chyba 404
        </p>

        <Heading as="h1" className="mt-3 text-3xl sm:text-4xl">
          Stránka sa nenašla
        </Heading>

        <Text className="mt-4 text-base leading-7 text-[#3E0F28]/70">
          Odkaz môže byť neplatný, stránka bola presunutá alebo už neexistuje.
          Skúste sa vrátiť na úvod alebo pokračujte k objednávke kalendára.
        </Text>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">Späť na úvod</Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/objednavka">Objednať kalendár</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
