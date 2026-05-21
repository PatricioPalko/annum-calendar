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
