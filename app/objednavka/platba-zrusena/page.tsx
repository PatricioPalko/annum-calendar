import Link from "next/link";

import {
  buildOrderPaymentPath,
  verifyOrderPaymentToken,
} from "@/lib/order-payment-token";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platba nebola dokončená",
  description:
    "Platba k objednávke nebola dokončená. Objednávku môžete zaplatiť znova bez opätovného nahrávania fotiek.",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{
    orderId?: string;
    /** @deprecated legacy cancel URLs used name-based order_code */
    order?: string;
    token?: string;
  }>;
};

export default async function PaymentCancelledPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const orderId = params.orderId;
  const legacyOrderCode = params.order;
  const token = params.token;

  let paymentPath: string | null = null;
  let displayOrderCode: string | null = null;

  // Require a valid payment token — never mint pay capability from identifiers alone.
  if (token && (orderId || legacyOrderCode)) {
    const { data: order } = orderId
      ? await supabaseAdmin
          .from("orders")
          .select("id, order_code, payment_status")
          .eq("id", orderId)
          .maybeSingle()
      : await supabaseAdmin
          .from("orders")
          .select("id, order_code, payment_status")
          .eq("order_code", legacyOrderCode!)
          .maybeSingle();

    if (
      order?.order_code &&
      order.payment_status !== "paid" &&
      verifyOrderPaymentToken(order.id, order.order_code, token)
    ) {
      paymentPath = buildOrderPaymentPath(order.id, order.order_code);
      displayOrderCode = order.order_code;
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF7F4] px-4 py-12 text-[#3E0F28] sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 text-center shadow-xl shadow-[#3E0F28]/10 sm:p-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]">
          Platba nebola dokončená
        </p>

        <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
          Objednávku máte uloženú
        </h1>

        {paymentPath && displayOrderCode && (
          <p className="mt-4 text-sm font-semibold text-[#3E0F28]/65">
            Číslo objednávky: {displayOrderCode}
          </p>
        )}

        <p className="mt-4 text-base font-medium leading-7 text-[#3E0F28]/70">
          {paymentPath
            ? "Platbu môžete skúsiť znova. Vaše nahraté fotky aj údaje zostali uložené, objednávku nemusíte vypĺňať odznova."
            : "Platbu môžete dokončiť cez odkaz v e-maile k objednávke. Vaše nahraté fotky aj údaje zostali uložené."}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {paymentPath && (
            <Link
              href={paymentPath}
              className="inline-flex rounded-md bg-[#3E0F28] px-5 py-3 text-sm font-bold text-white"
            >
              Zaplatiť znova
            </Link>
          )}

          <Link
            href="/"
            className="inline-flex rounded-md border border-[#EAD6DE] px-5 py-3 text-sm font-bold text-[#3E0F28]"
          >
            Späť na úvod
          </Link>
        </div>
      </div>
    </main>
  );
}
