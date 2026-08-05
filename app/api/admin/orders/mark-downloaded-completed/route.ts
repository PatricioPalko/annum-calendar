import { NextResponse } from "next/server";

import { isAdminEmail, isAdminMutationOriginAllowed } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAdminMutationOriginAllowed(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !isAdminEmail(user.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const completedAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "completed",
      completed_at: completedAt,
    })
    .not("downloaded_at", "is", null)
    .neq("status", "completed")
    .select("id");

  if (error) {
    console.error("MARK_DOWNLOADED_COMPLETED_ERROR:", error);

    return NextResponse.json(
      { message: "Objednávky sa nepodarilo označiť ako vybavené." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    updatedCount: data?.length ?? 0,
  });
}
