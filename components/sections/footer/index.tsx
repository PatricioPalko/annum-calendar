import Link from "next/link";

const footerLinks = [
  { label: "Ako to funguje", href: "/#ako-to-funguje" },
  { label: "Ukážky", href: "/#ukazky" },
  { label: "Cenník", href: "/#cennik" },
  { label: "FAQ", href: "/#faq" },
];

export function Footer() {
  return (
    <footer className="border-t border-[#EAD6DE] bg-[#FFF7F4]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <Link
            href="/"
            className="font-heading text-2xl font-bold tracking-tight text-primary"
          >
            Annum
            <span className="text-secondary pl-0.5">.</span>
          </Link>

          <p className="mt-1 text-sm font-medium text-[#3E0F28]/60">
            Osobné nástenné fotokalendáre.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-[#3E0F28]/65 transition hover:text-[#FC5A61]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-[#EAD6DE]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-xs font-medium text-[#3E0F28]/45 md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} Annum. Všetky práva vyhradené.</p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/ochrana-osobnych-udajov"
              className="transition hover:text-[#FC5A61]"
            >
              Ochrana osobných údajov
            </Link>

            <Link
              href="/obchodne-podmienky"
              className="transition hover:text-[#FC5A61]"
            >
              Obchodné podmienky
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
