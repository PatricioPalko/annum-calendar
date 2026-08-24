"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { MobileNavMenu } from "@/components/sections/navigation/mobile-nav-menu";
import { SectionLink } from "@/components/sections/navigation/section-link";
import { getNavigationLinkClassName } from "@/components/sections/navigation/navigation-styles";
import { Button } from "@/components/ui/button";
import { useActiveSection } from "@/helpers/use-active-section";

const navigationItems = [
  {
    label: "Pre koho",
    sectionId: "pre-koho",
  },
  {
    label: "Ako to prebieha",
    sectionId: "ako-to-funguje",
  },
  {
    label: "Čo je v balení",
    sectionId: "co-je-v-baleni",
  },
  {
    label: "Cenník",
    sectionId: "cennik",
  },
  {
    label: "FAQ",
    sectionId: "faq",
  },
] as const;

export default function Navigation() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const sectionIds = useMemo(
    () => navigationItems.map((item) => item.sectionId),
    [],
  );
  const activeSection = useActiveSection(sectionIds, isHomePage);
  const isAdminRoute =
    pathname.startsWith("/admin") && pathname !== "/admin/login";

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
          className="hidden items-center gap-4 lg:gap-5 xl:gap-7 md:flex"
          aria-label="Hlavná navigácia"
        >
          {navigationItems.map((item) => (
            <SectionLink
              key={item.sectionId}
              sectionId={item.sectionId}
              isActive={activeSection === item.sectionId}
              className={getNavigationLinkClassName(
                activeSection === item.sectionId,
              )}
            >
              {item.label}
            </SectionLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAdminRoute ? (
            <AdminLogoutButton className="hidden sm:inline-flex" />
          ) : (
            <>
              <Button
                variant="lime"
                asChild
                size="sm"
                className="hidden min-[420px]:inline-flex sm:size-default"
              >
                <Link href="/objednavka">Vytvoriť spomienky</Link>
              </Button>

              <Button
                variant="lime"
                asChild
                size="sm"
                className="min-[420px]:hidden"
              >
                <Link href="/objednavka">Spomienky</Link>
              </Button>
            </>
          )}

          <MobileNavMenu
            items={navigationItems}
            activeSection={activeSection}
            showLogout={isAdminRoute}
          />
        </div>
      </div>
    </header>
  );
}
