import Link from "next/link";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Heading, Text } from "@/components/ui/typography";
import { OPERATOR } from "@/lib/legal";

export type LegalSectionContent = {
  id: string;
  title: string;
  body: ReactNode;
};

type LegalDocumentProps = {
  title: string;
  path: `/${string}`;
  lead: string;
  updated: string;
  sections: readonly LegalSectionContent[];
};

const bodyClassName =
  "text-sm font-semibold leading-7 text-[#3E0F28]/80 sm:text-base sm:leading-7";

export function LegalText({ children }: { children: ReactNode }) {
  return <p className={bodyClassName}>{children}</p>;
}

export function LegalList({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm font-semibold leading-7 text-[#3E0F28]/80 sm:text-base">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalSubheading({ children }: { children: ReactNode }) {
  return (
    <Heading as="h3" className="pt-2 text-base sm:text-lg md:text-xl">
      {children}
    </Heading>
  );
}

export function LegalMailLink({ children }: { children?: ReactNode }) {
  return (
    <a
      href={`mailto:${OPERATOR.email}`}
      className="font-bold text-[#FC5A61] underline-offset-4 hover:underline"
    >
      {children ?? OPERATOR.email}
    </a>
  );
}

export function LegalDocument({
  title,
  path,
  lead,
  updated,
  sections,
}: LegalDocumentProps) {
  return (
    <main
      id="main-content"
      className="bg-[#FFF7F4] px-4 py-10 text-primary sm:py-16 md:px-6"
    >
      <article className="mx-auto max-w-3xl rounded-xl border border-[#EAD6DE] bg-white p-5 shadow-xl shadow-[#3E0F28]/10 sm:p-8 md:p-10">
        <Breadcrumbs
          items={[
            { name: "Domov", path: "/" },
            { name: title, path },
          ]}
        />

        <Heading as="h1" className="text-3xl! sm:text-4xl! md:text-5xl!">
          {title}
        </Heading>

        <Text variant="lead" className="mt-4">
          {lead}
        </Text>

        <p className="mt-3 text-sm font-semibold text-[#3E0F28]/60">
          Posledná aktualizácia: {updated}
        </p>

        <div className="mt-6 rounded-xl border border-[#EAD6DE] bg-[#FFF7F4] p-4 sm:p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FC5A61]">
            Kontakt
          </p>
          <p className={`${bodyClassName} mt-2`}>
            {OPERATOR.name}
            <br />
            {OPERATOR.street}, {OPERATOR.postalCity}
            <br />
            E-mail: <LegalMailLink />
          </p>
        </div>

        <nav aria-label="Obsah dokumentu" className="mt-8">
          <h2 className="font-heading text-lg font-bold text-primary">Obsah</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm font-semibold leading-6 text-[#3E0F28]/80 sm:text-base">
            {sections.map((section) => (
              <li key={section.id}>
                <Link
                  href={`${path}#${section.id}`}
                  className="rounded-sm underline-offset-4 hover:text-[#FC5A61] hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FC5A61]/30"
                >
                  {section.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 space-y-3"
            >
              <Heading as="h2" className="text-xl sm:text-2xl md:text-3xl">
                {section.title}
              </Heading>
              <div className="space-y-3">{section.body}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
