import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/seo";

type BreadcrumbItem = {
  name: string;
  path: `/${string}` | "/";
};

type BreadcrumbsProps = {
  items: readonly BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${item.path}`,
    })),
  };

  return (
    <nav aria-label="Drobečková navigácia" className="mb-6">
      <JsonLd data={jsonLd} />
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-[#3E0F28]/75">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.path} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-[#3E0F28]/35">
                  /
                </span>
              ) : null}
              {isLast ? (
                <span aria-current="page" className="text-[#3E0F28]">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="rounded-sm underline-offset-4 hover:text-[#FC5A61] hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FC5A61]/30"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
