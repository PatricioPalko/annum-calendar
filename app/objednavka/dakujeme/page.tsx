import Link from "next/link";

export default function OrderThankYouPage({
  searchParams,
}: {
  searchParams: {
    order?: string;
  };
}) {
  return (
    <main className="min-h-screen bg-[#FFF7F4] px-6 py-20 text-[#3E0F28]">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-xl shadow-[#3E0F28]/10">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]">
          Ďakujeme
        </p>

        <h1 className="mt-3 font-heading text-4xl font-bold">
          Objednávka bola prijatá
        </h1>

        {searchParams.order && (
          <p className="mt-4 text-sm font-semibold text-[#3E0F28]/65">
            Číslo objednávky: {searchParams.order}
          </p>
        )}

        <p className="mt-4 text-base font-medium leading-7 text-[#3E0F28]/70">
          Platbu sme prijali alebo ju práve spracovávame. Po kontrole podkladov
          začneme pripravovať váš kalendár.
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
