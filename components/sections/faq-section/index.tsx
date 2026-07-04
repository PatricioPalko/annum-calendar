import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Heading, Text } from "@/components/ui/typography";

import { MAX_PHOTOS, MIN_PHOTOS } from "@/lib/order/config";

const faqSections = [
  {
    title: "Fotky a kalendár",
    items: [
      {
        question: "Koľko fotiek musím nahrať?",
        answer: `Minimálne ${MIN_PHOTOS} fotiek. Odporúčame nahrať minimálne 26 fotiek (2 fotky na jeden mesiac) a 2 fotky na titulnú stranu. Nahrať môžete až ${MAX_PHOTOS} fotiek.`,
      },
      {
        question: "Aké formáty fotiek môžem nahrať?",
        answer:
          "Podporované sú formáty JPG, PNG a WEBP. Maximálna veľkosť jednej fotky je 10 MB. Fotky odporúčame nahrávať v čo najlepšej kvalite.",
      },
      {
        question: "Musia byť fotky na výšku alebo na šírku?",
        answer:
          "Nahrať môžete fotky na výšku aj na šírku. Pri príprave kalendára vyberieme vhodné rozloženie podľa konkrétnych fotiek tak, aby výsledok pôsobil čo najlepšie.",
      },
      {
        question: "Môžem do kalendára pridať vlastné meniny a narodeniny?",
        answer:
          "Áno, pri variante Premium môžete doplniť meniny a narodeniny, ktoré chcete mať v kalendári zvýraznené.",
      },
    ],
  },
  {
    title: "Cena a platba",
    items: [
      {
        question: "Ako funguje vlastný počet kusov?",
        answer:
          "Ak si vyberiete vlastný počet kusov, cena sa vypočíta podľa množstva. Pri väčšom odbere sa automaticky použije výhodnejšia cena za jeden kalendár.",
      },
      {
        question: "Kedy sa dozviem finálnu cenu?",
        answer:
          "Cena sa zobrazí priamo v konfigurátore. Pri Basic a Premium ide o cenu za kus podľa počtu rovnakých kalendárov. Pri Business objednávke od 10 kusov sa cena za kus znižuje podľa množstva — napríklad pri 50 kusoch je cena nižšia než pri objednávke 10 kusov.",
      },
      {
        question: "Ako prebieha platba?",
        answer:
          "Po odoslaní objednávky Vás presmerujeme na bezpečnú platobnú stránku Stripe, kde môžete zaplatiť kartou alebo dostupnou peňaženkou, napríklad Apple Pay alebo Google Pay. Objednávku začneme spracovávať po úspešnej platbe.",
      },
      {
        question: "Čo ak platbu nedokončím alebo zavriem platobnú stránku?",
        answer:
          "Objednávka zostane uložená a nemusíte znova nahrávať fotky. Po vytvorení objednávky Vám pošleme e-mail s odkazom na dokončenie platby. Platbu môžete zopakovať aj zo stránky, na ktorú sa vrátite po zrušení platby.",
      },
    ],
  },
  {
    title: "Doručenie",
    items: [
      {
        question: "Aké možnosti doručenia ponúkate?",
        answer:
          "Vybrať si môžete osobný odber v Košiciach alebo doručenie cez Packetu. Pri Packete si v objednávke vyberiete výdajné miesto alebo Z-BOX, ktorý Vám najviac vyhovuje.",
      },
      {
        question: "Je doručenie zahrnuté v cene?",
        answer:
          "Osobný odber v Košiciach je bez poplatku. Pri doručení cez Packetu sa cena doručenia pripočíta k objednávke a zobrazí sa v súhrne ešte pred platbou.",
      },
    ],
  },
  {
    title: "Objednávka a spracovanie",
    items: [
      {
        question: "Čo sa stane po odoslaní objednávky?",
        answer:
          "Po odoslaní objednávky sa objednávka uloží a prejdete na online platbu. E-mailom dostanete informáciu, že objednávka čaká na platbu. Po úspešnej platbe Vám príde potvrdenie a objednávku zaradíme na spracovanie.",
      },
      {
        question: "Ako zistím, že je kalendár pripravený alebo odoslaný?",
        answer:
          "Keď bude kalendár pripravený na osobný odber alebo odoslaný cez Packetu, pošleme Vám e-mail. Pri Packete Vám v e-maile zašleme aj informácie k zásielke, ak budú dostupné.",
      },
      {
        question: "Čo je zahrnuté v cene kalendára?",
        answer:
          "Cena zahŕňa spracovanie objednávky, prípravu kalendára z nahraných fotiek, tlač, zabalenie a základnú úpravu rozloženia podľa zvoleného variantu. Pri variante Premium je zahrnuté aj zvýraznenie vybraných menín a narodenín. Doručenie sa účtuje samostatne podľa zvoleného spôsobu doručenia.",
      },
    ],
  },
];

export function FaqSection() {
  return (
    <section className="mx-auto my-16 max-w-4xl px-4 scroll-mt-24" id="faq">
      <div className="mb-8 text-center">
        <Text variant="caption" as="span">
          FAQ
        </Text>

        <Heading as="h2" className="mt-2">
          Časté otázky
        </Heading>

        <Text variant="lead" className="mx-auto mt-3 max-w-2xl">
          Tu nájdete odpovede na najčastejšie otázky k objednávke kalendára,
          platbe a doručeniu.
        </Text>
      </div>

      <div className="space-y-8">
        {faqSections.map((section, sectionIndex) => (
          <div key={section.title}>
            <h3 className="mb-3 font-heading text-xl font-bold text-primary">
              {section.title}
            </h3>

            <Accordion type="multiple" className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <AccordionItem
                  key={item.question}
                  value={`section-${sectionIndex}-item-${itemIndex}`}
                  className="rounded-xl border border-soft bg-white px-4 shadow-sm"
                >
                  <AccordionTrigger className="text-left text-md font-bold text-primary hover:no-underline hover:cursor-pointer">
                    {item.question}
                  </AccordionTrigger>

                  <AccordionContent className="pr-8 text-sm font-semibold leading-6 tracking-wide text-[#3E0F28]/70">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FaqSection;
