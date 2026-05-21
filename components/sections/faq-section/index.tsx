import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Heading, Text } from "@/components/ui/typography";

const faqItems = [
  {
    question: "Koľko fotiek musím nahrať?",
    answer:
      "Minimálne 14 fotiek. Odporúčame nahrať minimálne 26 fotiek (2 fotky na jeden mesiac) a 2 fotky na titulnú stranu.",
  },
  {
    question: "Aké formáty fotiek môžem nahrať?",
    answer:
      "Podporované sú formáty JPG, PNG a WEBP. Maximálna veľkosť jednej fotky je 10 MB. Fotky nahrávajte v čo najlepšej kvalite.",
  },
  {
    question: "Môžem do kalendára pridať vlastné meniny a narodeniny?",
    answer:
      "Áno, pri variante Premium môžete doplniť meniny a narodeniny, ktoré chcete mať v kalendári zvýraznené.",
  },
  {
    question: "Ako funguje vlastný počet kusov?",
    answer:
      "Ak si vyberiete vlastný počet kusov, cena sa vypočíta podľa množstva. Pri väčšom odbere sa automaticky použije výhodnejšia cena za jeden kalendár.",
  },
  {
    question: "Kedy sa dozviem finálnu cenu?",
    answer:
      "Pri bežných variantoch sa cena zobrazí priamo v konfigurátore. Pri Business objednávke alebo špeciálnych požiadavkách Vám cenu potvrdíme individuálne.",
  },
  {
    question: "Čo sa stane po odoslaní objednávky?",
    answer:
      "Po odoslaní objednávky skontrolujeme podklady a ozveme sa Vám e-mailom s potvrdením a ďalším postupom.",
  },
  {
    question: "Čo je zahrnuté v cene kalendára?",
    answer:
      "Cena zahŕňa spracovanie objednávky, prípravu kalendára z nahraných fotiek, základnú úpravu rozloženia a tlač podľa zvoleného variantu. Pri variante Premium je zahrnuté aj zvýraznenie vybraných menín a narodenín.",
  },
  {
    question: "Musia byť fotky na výšku alebo na šírku?",
    answer:
      "Nahrať môžete fotky na výšku aj na šírku. Pri príprave kalendára vyberieme vhodné rozloženie podľa konkrétnych fotiek tak, aby výsledok pôsobil čo najlepšie.",
  },
];

export function FaqSection() {
  return (
    <section className="mx-auto my-16 max-w-4xl px-4">
      <div className="mb-8 text-center">
        <Text variant="caption" as="span">
          FAQ
        </Text>

        <Heading as="h2" className="mt-2">
          Časté otázky
        </Heading>

        <Text className="mx-auto mt-3 max-w-2xl">
          Tu nájdete odpovede na najčastejšie otázky k objednávke kalendára.
        </Text>
      </div>

      <Accordion type="multiple" className="space-y-3">
        {faqItems.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`item-${index}`}
            className="rounded-xl border border-soft bg-white px-4 shadow-sm"
          >
            <AccordionTrigger className="text-left text-sm font-bold text-primary hover:no-underline hover:cursor-pointer">
              {item.question}
            </AccordionTrigger>

            <AccordionContent className="text-sm font-medium leading-6 text-[#3E0F28]/70 pr-8">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export default FaqSection;
