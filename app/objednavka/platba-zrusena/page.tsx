import Link from "next/link";

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
    order?: string;
  }>;
};

export default async function PaymentCancelledPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const orderCode = params.order;

  return (
    <main className="min-h-screen bg-[#FFF7F4] px-4 py-12 text-[#3E0F28] sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 text-center shadow-xl shadow-[#3E0F28]/10 sm:p-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]">
          Platba nebola dokončená
        </p>

        <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
          Objednávku máte uloženú
        </h1>

        {orderCode && (
          <p className="mt-4 text-sm font-semibold text-[#3E0F28]/65">
            Číslo objednávky: {orderCode}
          </p>
        )}

        <p className="mt-4 text-base font-medium leading-7 text-[#3E0F28]/70">
          Platbu môžete skúsiť znova. Vaše nahraté fotky aj údaje zostali
          uložené, objednávku nemusíte vypĺňať odznova.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderCode && (
            <Link
              href={`/api/orders/${encodeURIComponent(orderCode)}/pay`}
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
