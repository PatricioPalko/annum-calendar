import Link from "next/link";

import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    label: "Ako to funguje",
    href: "/#ako-to-funguje",
  },
  {
    label: "Ukážka kalendára",
    href: "/#ukazka-kalendara",
  },
  {
    label: "Cenník",
    href: "/#cennik",
  },
  {
    label: "FAQ",
    href: "/#faq",
  },
];

export default function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#EAD6DE] bg-[#FFF7F4]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-0">
        <Link
          href="/"
          className="font-heading text-2xl font-bold tracking-tight text-primary"
        >
          Annum
          <span className="text-secondary pl-0.5">.</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-[#3E0F28]/70 transition hover:text-[#FC5A61] uppercase"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button variant="lime" asChild>
          <Link href="/objednavka">Vytvoriť kalendár</Link>
        </Button>
      </div>
    </header>
  );
}
