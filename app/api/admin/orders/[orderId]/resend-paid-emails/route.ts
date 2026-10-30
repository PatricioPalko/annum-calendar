import { NextResponse } from "next/server";

import { isAdminEmail, isAdminMutationOriginAllowed } from "@/lib/auth/admin";
import { resendMissingPaidOrderEmails } from "@/lib/order-payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  if (!isAdminMutationOriginAllowed(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !isAdminEmail(user.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await resendMissingPaidOrderEmails(orderId);

  switch (result.status) {
    case "not_found":
      return NextResponse.json(
        { message: "Objednávka neexistuje." },
        { status: 404 },
      );

    case "not_paid":
      return NextResponse.json(
        { message: "Objednávka ešte nie je zaplatená." },
        { status: 403 },
      );

    case "nothing_to_send":
      return NextResponse.json({
        ok: true,
        message: "Všetky e-maily k platbe už boli odoslané.",
      });

    case "error":
      return NextResponse.json(
        { message: "E-maily sa nepodarilo odoslať. Skúste to znova." },
        { status: 500 },
      );

    case "sent": {
      const failed = [
        result.customerRequested && !result.customerSent
          ? "potvrdenie zákazníkovi"
          : null,
        result.adminRequested && !result.adminSent
          ? "notifikácia adminovi"
          : null,
      ].filter((item): item is string => item !== null);

      if (failed.length > 0) {
        return NextResponse.json(
          {
            message: `Nepodarilo sa odoslať: ${failed.join(", ")}. Skontrolujte nastavenie e-mailov a skúste to znova.`,
          },
          { status: 502 },
        );
      }

      return NextResponse.json({ ok: true });
    }
  }
}
