import Link from "next/link";

import { CookieSettingsButton } from "@/components/cookiebot/cookie-settings-button";
import { SectionLink } from "@/components/sections/navigation/section-link";

const footerNavigationLinks = [
  { label: "Ako to funguje", sectionId: "ako-to-funguje" },
  { label: "Ukážka kalendára", sectionId: "ukazka-kalendara" },
  { label: "Cenník", sectionId: "cennik" },
  { label: "FAQ", sectionId: "faq" },
];

const footerLegalLinks = [
  { label: "Ochrana osobných údajov", href: "/ochrana-osobnych-udajov" },
  { label: "Obchodné podmienky", href: "/obchodne-podmienky" },
];

const contactEmail = "info@annum.sk";

export function Footer() {
  return (
    <footer className="border-t border-[#EAD6DE] bg-[#FFF7F4]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
        <div>
          <Link
            href="/"
            className="font-heading text-2xl font-bold tracking-tight text-primary"
          >
            Annum
            <span className="pl-0.5 text-secondary">.</span>
          </Link>

          <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-[#3E0F28]/60">
            Personalizované A3 nástenné fotokalendáre s kovovou väzbou a
            doručením cez Packetu.
          </p>

          <div className="mt-4 space-y-1 text-sm font-semibold text-[#3E0F28]/65">
            <p>
              E-mail:{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-primary underline-offset-4 transition hover:text-[#FC5A61] hover:underline"
              >
                {contactEmail}
              </a>
            </p>
          </div>
        </div>

        <nav aria-label="Navigácia v pätičke">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FC5A61]">
            Navigácia
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {footerNavigationLinks.map((link) => (
              <SectionLink
                key={link.sectionId}
                sectionId={link.sectionId}
                className="w-fit text-sm font-bold text-[#3E0F28]/65 transition hover:text-[#FC5A61]"
              >
                {link.label}
              </SectionLink>
            ))}
          </div>
        </nav>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FC5A61]">
            Právne informácie
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {footerLegalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="w-fit text-sm font-bold text-[#3E0F28]/65 transition hover:text-[#FC5A61]"
              >
                {link.label}
              </Link>
            ))}

            <CookieSettingsButton className="w-fit text-left text-sm font-bold text-[#3E0F28]/65 transition hover:text-[#FC5A61]" />
          </div>

          <div className="mt-4 space-y-1 text-xs font-medium leading-5 text-[#3E0F28]/50">
            <p>Obchodné meno: LAETAS s. r. o.</p>
            <p>IČO: 57 810 133</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#EAD6DE]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs font-medium text-[#3E0F28]/45 md:flex-row md:items-center md:justify-between md:px-6">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} Annum. Všetky práva vyhradené.
          </p>

          <p>Personalizované kalendáre z fotiek · Košice · Slovensko</p>
        </div>
      </div>
    </footer>
  );
}
