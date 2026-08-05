"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

type SectionLinkProps = {
  sectionId: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
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

    if (Date.now() - startedAt < 2500) {
      requestAnimationFrame(tryScroll);
    }
  }

  requestAnimationFrame(tryScroll);
}

export function SectionLink({
  sectionId,
  children,
  className,
  onClick,
}: SectionLinkProps) {
  const router = useRouter();
  const pathname = usePathname();

  const href = `/#${sectionId}`;

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    // Allow open-in-new-tab / modified clicks to use the native link.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      onClick?.();
      return;
    }

    event.preventDefault();
    onClick?.();

    const openDetails = document.querySelector(
      "header details[open]",
    ) as HTMLDetailsElement | null;
    if (openDetails) {
      openDetails.open = false;
    }

    if (pathname === "/") {
      window.history.pushState(null, "", `#${sectionId}`);
      scrollToSection(sectionId);
      return;
    }

    router.push(href, {
      scroll: false,
    });

    window.setTimeout(() => {
      scrollToSection(sectionId);
    }, 50);
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
