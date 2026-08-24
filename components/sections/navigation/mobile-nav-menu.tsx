"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { SectionLink } from "@/components/sections/navigation/section-link";
import { getMobileNavigationLinkClassName } from "@/components/sections/navigation/navigation-styles";
import { Button } from "@/components/ui/button";

type MobileNavMenuProps = {
  items: ReadonlyArray<{ label: string; sectionId: string }>;
  activeSection?: string | null;
  showLogout?: boolean;
};

export function MobileNavMenu({
  items,
  activeSection = null,
  showLogout = false,
}: MobileNavMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const details = detailsRef.current;

    if (!details) {
      return;
    }

    function handleToggle() {
      setIsOpen(Boolean(detailsRef.current?.open));
    }

    details.addEventListener("toggle", handleToggle);

    return () => {
      details.removeEventListener("toggle", handleToggle);
    };
  }, []);

  return (
    <details ref={detailsRef} className="group relative md:hidden">
      <summary
        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md text-[#3E0F28] transition hover:bg-[#FFF7F4] [&::-webkit-details-marker]:hidden"
        aria-label={isOpen ? "Zavrieť menu" : "Otvoriť menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
      >
        <Menu className="size-5 group-open:hidden" aria-hidden="true" />
        <X className="hidden size-5 group-open:block" aria-hidden="true" />
      </summary>

      <nav
        id="mobile-nav-panel"
        aria-label="Mobilná navigácia"
        className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-md border border-[#EAD6DE] bg-[#FFF7F4] p-3 shadow-lg"
      >
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <SectionLink
              key={item.sectionId}
              sectionId={item.sectionId}
              isActive={activeSection === item.sectionId}
              className={getMobileNavigationLinkClassName(
                activeSection === item.sectionId,
              )}
            >
              {item.label}
            </SectionLink>
          ))}

          {showLogout ? (
            <AdminLogoutButton className="mt-2 w-full sm:hidden" />
          ) : (
            <Button variant="lime" asChild className="mt-2 w-full">
              <Link href="/objednavka">Vytvoriť spomienky</Link>
            </Button>
          )}
        </div>
      </nav>
    </details>
  );
}
