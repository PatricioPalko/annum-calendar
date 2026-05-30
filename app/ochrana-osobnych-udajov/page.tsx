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

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[#FFF7F4] px-4 py-16 text-primary md:px-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-[#EAD6DE] bg-white p-6 shadow-xl shadow-[#3E0F28]/10 md:p-10">
        <Heading as="h1" className="mt-3 text-2xl!">
          Ochrana osobných údajov
        </Heading>

        <Text variant="lead" className="mt-5">
          Nižšie nájdete informácie o tom, aké údaje spracúvame pri vytvorení
          objednávky a na aký účel ich používame.
        </Text>

        <div className="mt-10 space-y-10">
          <LegalSection title="Aké údaje spracúvame">
            <Text>
              Pri vytvorení objednávky spracúvame údaje, ktoré zadáte vo
              formulári: meno, priezvisko, e-mail, telefónne číslo, poznámku k
              objednávke, zvolený typ kalendára, počet kusov, dôležité dátumy a
              nahraté fotky.
            </Text>
          </LegalSection>

          <LegalSection title="Na čo údaje používame">
            <Text>
              Údaje používame na spracovanie objednávky, prípravu
              personalizovaného kalendára a komunikáciu k danej objednávke.
            </Text>

            <Text>
              Vaše údaje nepoužívame na marketingové účely bez samostatného
              súhlasu.
            </Text>
          </LegalSection>

          <LegalSection title="Nahraté fotky">
            <Text>
              Nahraté fotky slúžia iba na prípravu objednaného kalendára.
              Nepoužívame ich na verejnú prezentáciu, reklamu ani sociálne siete
              bez vášho výslovného súhlasu.
            </Text>
          </LegalSection>

          <LegalSection title="Uchovávanie údajov">
            <Text>
              Údaje uchovávame po dobu potrebnú na vybavenie objednávky a
              následnú administráciu. Po tejto dobe môžu byť údaje a nahraté
              fotky odstránené.
            </Text>
          </LegalSection>

          <LegalSection title="Prístup k údajom">
            <Text>
              K údajom má prístup iba osoba spracúvajúca objednávku. Údaje
              neposkytujeme tretím stranám, okrem služieb potrebných na
              technické spracovanie objednávky, napríklad úložisko fotiek,
              databáza alebo e-mailová služba.
            </Text>
          </LegalSection>

          <LegalSection title="Vaše práva">
            <Text>
              Môžete nás požiadať o informáciu, aké údaje o vás spracúvame,
              prípadne o ich opravu alebo odstránenie, ak to nebráni vybaveniu
              objednávky alebo zákonným povinnostiam.
            </Text>
          </LegalSection>

          <LegalSection title="Kontakt">
            <Text>
              Ak máte otázky k spracovaniu osobných údajov alebo chcete požiadať
              o odstránenie údajov, kontaktujte nás e-mailom.
            </Text>

            <Text className="font-semibold text-primary">E-mail:</Text>
          </LegalSection>
        </div>
      </div>
    </main>
  );
}
