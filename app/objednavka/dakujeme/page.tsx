import Link from "next/link";

import { ClearOrderFormDraft } from "@/components/order/clear-order-form-draft";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ďakujeme za objednávku",
  description:
    "Objednávka bola prijatá. Potvrdenie s pokynmi k platbe vám pošleme e-mailom.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderThankYouPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#FFF7F4] px-4 py-12 text-[#3E0F28] sm:px-6 sm:py-20"
    >
      <ClearOrderFormDraft />
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 text-center shadow-xl shadow-[#3E0F28]/10 sm:p-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]">
          Ďakujeme
        </p>

        <h1 className="mt-3 font-heading text-2xl font-bold sm:text-4xl">
          Objednávka bola prijatá
        </h1>

        <p className="mt-4 text-base font-medium leading-7 text-[#3E0F28]/70">
          Potvrdenie so súhrnom objednávky a pokynmi k platbe vám o chvíľu
          príde e-mailom. Keď bude kalendár pripravený na osobný odber,
          ozveme sa.
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
