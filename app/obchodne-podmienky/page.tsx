import { Heading, Text } from "@/components/ui/typography";

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
          personalizovaného nástenného kalendára.
        </Text>

        <div className="mt-10 space-y-10">
          <LegalSection title="Predmet objednávky">
            <Text>
              Prostredníctvom objednávkového formulára si môžete objednať
              personalizovaný A3 nástenný kalendár pripravený z vašich fotiek a
              zadaných údajov.
            </Text>
          </LegalSection>

          <LegalSection title="Vytvorenie objednávky">
            <Text>
              Objednávka vzniká odoslaním formulára. Po prijatí objednávky
              skontrolujeme nahraté podklady a začneme ich spracúvať.
            </Text>

            <Text>
              Po odoslaní objednávky dostanete potvrdenie e-mailom. Kontaktovať
              vás budeme aj v prípade, že bude potrebné doplniť alebo upresniť
              podklady.
            </Text>
          </LegalSection>

          <LegalSection title="Cena">
            <Text>
              Cena sa zobrazuje v objednávkovom formulári podľa zvoleného typu
              kalendára a počtu kusov.
            </Text>

            <Text>
              Pri Business objednávkach alebo individuálnych požiadavkách môže
              byť cena potvrdená samostatne podľa rozsahu objednávky.
            </Text>
          </LegalSection>

          <LegalSection title="Platba">
            <Text>
              Platba prebieha po potvrdení objednávky podľa pokynov, ktoré vám
              zašleme e-mailom. Môže ísť napríklad o platbu prevodom na účet.
            </Text>

            <Text>
              Objednávka sa spracúva individuálne podľa dodaných podkladov.
            </Text>
          </LegalSection>

          <LegalSection title="Podklady od zákazníka">
            <Text>
              Zákazník zodpovedá za správnosť zadaných údajov a za to, že má
              právo použiť nahraté fotky na vytvorenie kalendára.
            </Text>

            <Text>
              Fotky by mali byť v dostatočnej kvalite a vo formáte JPG, PNG
              alebo WEBP.
            </Text>
          </LegalSection>

          <LegalSection title="Personalizovaný produkt">
            <Text>
              Kalendár je pripravovaný individuálne podľa dodaných fotiek,
              údajov a zvoleného variantu. Výsledný produkt preto závisí od
              kvality a charakteru nahratých podkladov.
            </Text>
          </LegalSection>

          <LegalSection title="Zmeny v objednávke">
            <Text>
              Ak potrebujete upraviť údaje alebo doplniť podklady, kontaktujte
              nás čo najskôr po odoslaní objednávky. Po začatí spracovania už
              nemusí byť možné vykonať všetky zmeny.
            </Text>
          </LegalSection>

          <LegalSection title="Dodanie">
            <Text>
              O pripravenosti kalendára vás budeme informovať e-mailom alebo
              telefonicky. Spôsob odovzdania alebo doručenia bude dohodnutý
              individuálne.
            </Text>
          </LegalSection>

          <LegalSection title="Kontakt">
            <Text>
              V prípade otázok k objednávke, platbe alebo dodaniu nás
              kontaktujte e-mailom.
            </Text>

            <Text className="font-semibold text-primary">
              E-mail: doplňte-váš-email@example.com
            </Text>
          </LegalSection>
        </div>
      </div>
    </main>
  );
}
