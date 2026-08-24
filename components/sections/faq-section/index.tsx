import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { Heading, SectionLabel, Text } from "@/components/ui/typography";

import { MAX_PHOTOS, MIN_PHOTOS, ORDER_HANGING_SET_INCLUSION } from "@/lib/order/config";

const faqSections = [
  {
    title: "Spomienky a objednávka",
    items: [
      {
        question: "Je Annum vhodné aj ako darček?",
        answer:
          "Áno — kalendár spomienok je personalizovaný darček, ktorý obdarovaný uvidí každý deň celý rok. Hodí sa pre rodinu, partnera, starých rodičov aj ako firemný darček.",
      },
      {
        question: "Musím niečo layoutovať alebo upravovať fotky?",
        answer:
          "Nie. Nahrajete fotky a my pripravíme rozloženie, tlač aj zabalenie. Nemusíte riešiť editor ani grafiku.",
      },
      {
        question: "Príde kalendár pekne zabalený?",
        answer:
          "Áno. V cene je príprava, tlač a zabalenie. Ku každej objednávke pridáme aj set na zavesenie (2× klinček a 1× samolepiaci háčik).",
      },
      {
        question: "Môžem objednať viac rovnakých kalendárov naraz?",
        answer:
          "Áno. Pri viacerých rovnakých kusoch sa automaticky použije výhodnejšia cena za jeden kalendár. V objednávke zvolíte počet kusov.",
      },
    ],
  },
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
          "Cena sa zobrazí priamo pri objednávke. Pri Basic a Premium ide o cenu za kus podľa počtu rovnakých kalendárov (uvedené s DPH). Pri objednávke od 10 kusov pre firmy pripravíme nezáväznú ponuku na mieru.",
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
          "Kalendár doručujeme cez Packetu. V objednávke si vyberiete výdajné miesto alebo Z-BOX, ktorý vám najviac vyhovuje.",
      },
      {
        question: "Ako fungujú termíny doručenia a várky výroby?",
        answer:
          "Objednávky pripravujeme v spoločných várkach tlače — pri objednávke vám v súhrne ukážeme aktuálnu várku a odhadovaný termín doručenia. Presný termín potvrdíme po zaplatení.",
      },
      {
        question: "Stihnem kalendár ako darček na Vianoce?",
        answer:
          "Áno — pri vianočnej várke stačí objednávku odoslať a zaplatiť do uvedeného termínu na stránke Termíny doručenia. Odporúčame objednať skôr, aby sme mali rezervu na prípravu a tlač.",
      },
      {
        question: "Je doručenie zahrnuté v cene?",
        answer:
          "Doručenie cez Packetu sa účtuje samostatne. Cena doručenia sa pripočíta k objednávke a zobrazí sa v súhrne ešte pred platbou (s DPH).",
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
          "Keď bude kalendár odoslaný cez Packetu, pošleme vám e-mail. V e-maile zašleme aj informácie k zásielke, ak budú dostupné.",
      },
      {
        question: "Čo je zahrnuté v cene kalendára?",
        answer:
          `Cena zahŕňa spracovanie objednávky, prípravu kalendára z nahraných fotiek, tlač, zabalenie, ${ORDER_HANGING_SET_INCLUSION} a základnú úpravu rozloženia podľa zvoleného variantu. Pri variante Premium je zahrnuté aj zvýraznenie vybraných menín a narodenín. Doručenie sa účtuje samostatne podľa zvoleného spôsobu doručenia.`,
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqSections.flatMap((section) =>
    section.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  ),
};

export function FaqSection() {
  return (
    <section className="mx-auto my-10 max-w-6xl scroll-mt-24 px-4" id="faq">
      <JsonLd data={faqJsonLd} />
      <div className="mb-5 text-center">
        <SectionLabel>FAQ</SectionLabel>

        <Heading as="h2" className="mt-2">
          Časté otázky
        </Heading>

        <Text variant="lead" className="mx-auto mt-2 max-w-2xl text-sm sm:text-base">
          Odpovede na otázky k spomienkam, objednávke, platbe a doručeniu.
        </Text>
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
        {faqSections.map((section, sectionIndex) => (
          <div key={section.title}>
            <h3 className="mb-2 font-heading text-base font-bold text-primary sm:text-lg">
              {section.title}
            </h3>

            <Accordion type="multiple" className="space-y-2">
              {section.items.map((item, itemIndex) => (
                <AccordionItem
                  key={item.question}
                  value={`section-${sectionIndex}-item-${itemIndex}`}
                  className="rounded-lg border border-soft bg-white px-3 shadow-sm"
                >
                  <AccordionTrigger className="py-3 text-left text-sm font-bold text-primary hover:no-underline hover:cursor-pointer">
                    {item.question}
                  </AccordionTrigger>

                  <AccordionContent className="break-words pb-3 pr-1 text-sm font-semibold leading-6 text-[#3E0F28]/70 sm:pr-4">
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
