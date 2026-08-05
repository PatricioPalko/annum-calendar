"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SiteShellProps = {
  navigation: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function SiteShell({ navigation, footer, children }: SiteShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return children;
  }

  return (
    <>
      {navigation}
      {children}
      {footer}
    </>
  );
}
