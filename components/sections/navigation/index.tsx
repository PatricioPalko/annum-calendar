import Link from "next/link";

import { MobileNavMenu } from "@/components/sections/navigation/mobile-nav-menu";
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#EAD6DE] bg-[#FFF7F4]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="shrink-0 font-heading text-lg font-bold tracking-tight text-primary sm:text-2xl"
        >
          Annum
          <span className="pl-0.5 text-secondary">.</span>
        </Link>

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Hlavná navigácia"
        >
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

          <MobileNavMenu items={navigationItems} />
        </div>
      </div>
    </header>
  );
}
