import OrderForm from "@/components/sections/order-form";
import { Heading } from "@/components/ui/typography";

export default function KalendarPage() {
  return (
    <main className={`font-body min-h-screen bg-[#FFF7F4] p-6 text-[#3E0F28]`}>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[2fr_0.85fr] md:items-center">
          <div>
            <Heading as="h1">
              Vytvor si kalendár
              <span className="block text-secondary">jednoducho a rýchlo</span>
            </Heading>

            <p className="mt-6 max-w-xl text-lg leading-8 text-primary font-medium">
              Vyber typ kalendára, počet kusov a nahraj fotky. Pri Premium
              variante môžeš doplniť aj narodeniny, meniny alebo výročia.
              <span className="block font-semibold text-secondary">
                {" "}
                Všetko ostatné nechaj na nás.
              </span>
            </p>
          </div>
        </div>
      </section>
      <div className="relative block">
        <OrderForm />
      </div>
    </main>
  );
}
