import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export function isAdminEmail(email?: string | null) {
  if (!email) return false;

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((item) =>
      item.trim().toLowerCase(),
    ) ?? [];

  return adminEmails.includes(email.toLowerCase());
}

/** Reject cross-site admin mutations when Origin/Referer do not match the app. */
export function isAdminMutationOriginAllowed(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return false;
  }

  let expectedOrigin: string;

  try {
    expectedOrigin = new URL(appUrl).origin;
  } catch {
    return false;
  }

  const origin = request.headers.get("origin");

  if (origin) {
    return origin === expectedOrigin;
  }

  const referer = request.headers.get("referer");

  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return false;
}

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !isAdminEmail(user.email)) {
    redirect("/admin/login");
  }

  return user;
}
