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
  const isAdminLogin = pathname === "/admin/login";

  if (isAdminLogin) {
    return children;
  }

  return (
    <>
      {navigation}
      <div className="h-16 shrink-0" aria-hidden="true" />
      {children}
      {!pathname.startsWith("/admin") && footer}
    </>
  );
}
