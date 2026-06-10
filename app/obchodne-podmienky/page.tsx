import { Heading, Text } from "@/components/ui/typography";

const CONTACT_EMAIL = "info@annum.sk";
const BUSINESS_NAME = "Annum";

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <Text variant="lead" className="uppercase text-primary font-semibold">
        {title}
      </Text>

      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="bg-[#FFF7F4] px-4 py-16 text-primary md:px-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-[#EAD6DE] bg-white p-6 shadow-xl shadow-[#3E0F28]/10 md:p-10">
        <Heading as="h1" className="mt-3 text-2xl!">
          Obchodné podmienky
        </Heading>

        <Text variant="lead" className="mt-5">
          Tieto podmienky upravujú vytvorenie a spracovanie objednávky
          personalizovaného A3 nástenného kalendára.
        </Text>

        <div className="mt-10 space-y-10">
          <LegalSection title="Predávajúci">
            <Text>
              Predávajúcim je {BUSINESS_NAME}. Doplňte sem identifikačné údaje
              predávajúceho, napríklad obchodné meno, IČO, sídlo alebo adresu
              prevádzky.
            </Text>

            <Text className="font-semibold text-primary">
              E-mail: {CONTACT_EMAIL}
            </Text>
          </LegalSection>

          <LegalSection title="Predmet objednávky">
            <Text>
              Prostredníctvom objednávkového formulára si môžete objednať
              personalizovaný A3 nástenný kalendár pripravený z vašich fotiek,
              zadaných údajov a podľa zvoleného variantu.
            </Text>

            <Text>
              Pri variante Premium môžete doplniť meniny a narodeniny, ktoré
              chcete mať v kalendári zvýraznené. Pri Business objednávke alebo
              špeciálnych požiadavkách môže byť rozsah objednávky dohodnutý
              individuálne.
            </Text>
          </LegalSection>

          <LegalSection title="Vytvorenie objednávky">
            <Text>
              Objednávka vzniká odoslaním objednávkového formulára a uložením
              objednávky v systéme. Po odoslaní objednávky môžete byť
              presmerovaní na online platbu.
            </Text>

            <Text>
              Po vytvorení objednávky dostanete e-mail s informáciou, že
              objednávka bola uložená a čaká na platbu. Ak platbu nedokončíte,
              môžete ju dokončiť cez odkaz zaslaný e-mailom alebo cez stránku,
              na ktorú sa vrátite po zrušení platby.
            </Text>

            <Text>
              Objednávku začíname spracúvať po úspešnej platbe, prípadne po
              individuálnej dohode pri špecifickej objednávke.
            </Text>
          </LegalSection>

          <LegalSection title="Cena">
            <Text>
              Cena sa zobrazuje v objednávkovom formulári podľa zvoleného typu
              kalendára, počtu kusov, prípadného zľavového kódu a zvoleného
              spôsobu doručenia.
            </Text>

            <Text>
              Zľava sa uplatňuje na cenu produktu, nie nevyhnutne na cenu
              doručenia. Cena doručenia sa zobrazuje samostatne v súhrne
              objednávky a pripočíta sa k celkovej sume.
            </Text>

            <Text>
              Pri Business objednávkach alebo individuálnych požiadavkách môže
              byť cena potvrdená samostatne podľa rozsahu objednávky.
            </Text>
          </LegalSection>

          <LegalSection title="Platba">
            <Text>
              Online platba prebieha cez platobnú bránu Stripe. Na platobnej
              stránke môžete zaplatiť kartou alebo inými dostupnými spôsobmi
              platby, napríklad Apple Pay alebo Google Pay, ak sú pre vaše
              zariadenie dostupné.
            </Text>

            <Text>
              Objednávka je považovaná za uhradenú až po potvrdení úspešnej
              platby. Po úspešnej platbe dostanete e-mailové potvrdenie.
            </Text>

            <Text>
              Ak platbu zrušíte alebo nedokončíte, objednávka zostane uložená,
              ale nebude zaradená na spracovanie, kým nebude platba úspešne
              dokončená.
            </Text>
          </LegalSection>

          <LegalSection title="Podklady od zákazníka">
            <Text>
              Zákazník zodpovedá za správnosť zadaných údajov, výber variantu,
              počet kusov, správnosť dôležitých dátumov a za to, že má právo
              použiť nahraté fotky na vytvorenie kalendára.
            </Text>

            <Text>
              Fotky by mali byť v dostatočnej kvalite a vo formáte JPG, PNG
              alebo WEBP. Maximálna veľkosť jednej fotky je uvedená v
              objednávkovom formulári.
            </Text>

            <Text>
              Ak sú nahraté fotky alebo údaje neúplné, chybné alebo technicky
              nevhodné, môžeme vás kontaktovať so žiadosťou o doplnenie alebo
              úpravu podkladov.
            </Text>
          </LegalSection>

          <LegalSection title="Personalizovaný produkt">
            <Text>
              Kalendár je pripravovaný individuálne podľa dodaných fotiek,
              údajov a zvoleného variantu. Výsledný produkt preto závisí od
              kvality a charakteru nahratých podkladov.
            </Text>

            <Text>
              Keďže ide o personalizovaný produkt zhotovený podľa požiadaviek
              zákazníka, po začatí spracovania objednávky nemusí byť možné
              objednávku zrušiť alebo odstúpiť od zmluvy rovnakým spôsobom ako
              pri bežnom nepoužitom tovare.
            </Text>
          </LegalSection>

          <LegalSection title="Zmeny v objednávke">
            <Text>
              Ak potrebujete upraviť údaje, výber doručenia alebo doplniť
              podklady, kontaktujte nás čo najskôr po odoslaní objednávky. Po
              začatí spracovania už nemusí byť možné vykonať všetky zmeny.
            </Text>
          </LegalSection>

          <LegalSection title="Doručenie a osobný odber">
            <Text>
              Pri objednávke si môžete zvoliť osobný odber v Košiciach alebo
              doručenie cez Packetu.
            </Text>

            <Text>
              Pri osobnom odbere vás budeme informovať e-mailom, keď bude
              kalendár pripravený na prevzatie. Presný čas a miesto odberu môžu
              byť dohodnuté individuálne.
            </Text>

            <Text>
              Pri doručení cez Packetu si v objednávke vyberiete výdajné miesto
              alebo Z-BOX. Po odoslaní objednávky vám môžeme zaslať e-mail s
              informáciou o odoslaní a prípadným sledovacím číslom zásielky, ak
              je dostupné.
            </Text>
          </LegalSection>

          <LegalSection title="Dodacia lehota">
            <Text>
              Dodacia lehota závisí od rozsahu objednávky, kvality a úplnosti
              dodaných podkladov, zvoleného počtu kusov a kapacity spracovania.
            </Text>

            <Text>
              O pripravenosti na osobný odber alebo odoslaní cez Packetu vás
              budeme informovať e-mailom.
            </Text>
          </LegalSection>

          <LegalSection title="Reklamácie">
            <Text>
              Ak má dodaný kalendár výrobnú chybu alebo nezodpovedá potvrdenej
              objednávke, kontaktujte nás e-mailom a uveďte číslo objednávky,
              popis problému a ideálne aj fotografiu vady.
            </Text>

            <Text>
              Reklamácia sa nevzťahuje na nedostatky spôsobené nízkou kvalitou
              nahratých fotiek, nesprávne zadanými údajmi alebo podkladmi
              dodanými zákazníkom, ak boli použité podľa objednávky.
            </Text>
          </LegalSection>

          <LegalSection title="Zodpovednosť">
            <Text>
              Zákazník zodpovedá za obsah nahratých fotiek a za to, že ich
              použitím neporušuje práva tretích osôb. Vyhradzujeme si právo
              odmietnuť spracovanie obsahu, ktorý je nezákonný, urážlivý alebo
              inak nevhodný.
            </Text>
          </LegalSection>

          <LegalSection title="Ochrana osobných údajov">
            <Text>
              Informácie o spracúvaní osobných údajov, nahratých fotiek,
              platobných údajov a údajov potrebných na doručenie nájdete v
              dokumente Ochrana osobných údajov.
            </Text>
          </LegalSection>

          <LegalSection title="Kontakt">
            <Text>
              V prípade otázok k objednávke, platbe, doručeniu alebo reklamácii
              nás kontaktujte e-mailom.
            </Text>

            <Text className="font-semibold text-primary">
              E-mail: {CONTACT_EMAIL}
            </Text>
          </LegalSection>
        </div>
      </div>
    </main>
  );
}
