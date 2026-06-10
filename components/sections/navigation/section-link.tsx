"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

type SectionLinkProps = {
  sectionId: string;
  children: ReactNode;
  className?: string;
};

function scrollToSection(sectionId: string) {
  const startedAt = Date.now();

  function tryScroll() {
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      return;
    }

    if (Date.now() - startedAt < 1000) {
      requestAnimationFrame(tryScroll);
    }
  }

  requestAnimationFrame(tryScroll);
}

export function SectionLink({
  sectionId,
  children,
  className,
}: SectionLinkProps) {
  const router = useRouter();
  const pathname = usePathname();

  const href = `/#${sectionId}`;

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (pathname === "/") {
      window.history.pushState(null, "", `#${sectionId}`);
      scrollToSection(sectionId);
      return;
    }

    router.push(href, {
      scroll: false,
    });

    scrollToSection(sectionId);
  }

  return (
    <Link
      href={href}
      scroll={false}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}
