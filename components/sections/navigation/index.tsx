import Link from "next/link";

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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-heading text-2xl font-bold tracking-tight text-primary"
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

        <Button variant="lime" asChild>
          <Link href="/objednavka">Vytvoriť kalendár</Link>
        </Button>
      </div>
    </header>
  );
}
