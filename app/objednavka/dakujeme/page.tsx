import Link from "next/link";

import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{
    session_id?: string;
    order?: string;
  }>;
};

export default async function OrderThankYouPage({ searchParams }: PageProps) {
  const params = await searchParams;

  let orderCode: string | null = null;
  let isPaid = false;

  if (params.session_id) {
    const session = await stripe.checkout.sessions.retrieve(params.session_id);

    orderCode = session.metadata?.orderCode ?? null;
    isPaid = session.payment_status === "paid";
  }

  if (!orderCode && params.order) {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_code, payment_status")
      .eq("order_code", params.order)
      .maybeSingle();

    if (order) {
      orderCode = order.order_code;
      isPaid = order.payment_status === "paid";
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF7F4] px-6 py-20 text-[#3E0F28]">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-xl shadow-[#3E0F28]/10">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]">
          Ďakujeme
        </p>

        <h1 className="mt-3 font-heading text-4xl font-bold">
          Objednávka bola prijatá
        </h1>

        {orderCode && (
          <p className="mt-4 text-sm font-semibold text-[#3E0F28]/65">
            Číslo objednávky: {orderCode}
          </p>
        )}

        <p className="mt-4 text-base font-medium leading-7 text-[#3E0F28]/70">
          {isPaid
            ? "Platba prebehla úspešne. Začíname pripravovať váš kalendár."
            : "Platbu ešte spracovávame. Potvrdenie vám pošleme e-mailom."}
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-md bg-[#3E0F28] px-5 py-3 text-sm font-bold text-white"
        >
          Späť na úvod
        </Link>
      </div>
    </main>
  );
}
