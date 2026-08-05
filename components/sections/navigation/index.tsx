import Link from "next/link";
import { Menu, X } from "lucide-react";

import { SectionLink } from "@/components/sections/navigation/section-link";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    label: "Ako to funguje",
    sectionId: "ako-to-funguje",
  },
  {
    label: "Ukážka kalendára",
    sectionId: "ukazka-kalendara",
  },
  {
    label: "Cenník",
    sectionId: "cennik",
  },
  {
    label: "FAQ",
    sectionId: "faq",
  },
];

export default function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#EAD6DE] bg-[#FFF7F4]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="shrink-0 font-heading text-xl font-bold tracking-tight text-primary sm:text-2xl"
        >
          Annum
          <span className="pl-0.5 text-secondary">.</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navigationItems.map((item) => (
            <SectionLink
              key={item.sectionId}
              sectionId={item.sectionId}
              className="text-sm font-semibold uppercase text-[#3E0F28]/70 transition hover:text-[#FC5A61]"
            >
              {item.label}
            </SectionLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="lime"
            asChild
            size="sm"
            className="hidden min-[420px]:inline-flex sm:size-default"
          >
            <Link href="/objednavka">Vytvoriť kalendár</Link>
          </Button>

          <Button
            variant="lime"
            asChild
            size="sm"
            className="min-[420px]:hidden"
          >
            <Link href="/objednavka">Objednať</Link>
          </Button>

          <details className="group relative md:hidden">
            <summary
              className="flex size-10 list-none items-center justify-center rounded-md text-[#3E0F28] transition hover:bg-[#FFF7F4] [&::-webkit-details-marker]:hidden"
              aria-label="Menu"
            >
              <Menu className="size-5 group-open:hidden" />
              <X className="hidden size-5 group-open:block" />
            </summary>

            <nav className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-md border border-[#EAD6DE] bg-[#FFF7F4] p-3 shadow-lg">
              <div className="flex flex-col gap-1">
                {navigationItems.map((item) => (
                  <SectionLink
                    key={item.sectionId}
                    sectionId={item.sectionId}
                    className="rounded-md px-3 py-3 text-sm font-semibold uppercase text-[#3E0F28]/75 transition hover:bg-white hover:text-[#FC5A61]"
                  >
                    {item.label}
                  </SectionLink>
                ))}

                <Button variant="lime" asChild className="mt-2 w-full">
                  <Link href="/objednavka">Vytvoriť kalendár</Link>
                </Button>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
