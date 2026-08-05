import { CookiebotDeclaration } from "@/components/cookiebot/cookiebot-declaration";
import { Heading, Text } from "@/components/ui/typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ochrana osobných údajov",
  description:
    "Zásady ochrany osobných údajov e-shopu Annum — personalizované A3 kalendáre.",
  alternates: {
    canonical: "/ochrana-osobnych-udajov",
  },
};

const CONTACT_EMAIL = "info@annum.sk";
const BUSINESS_NAME = "Ing. Laura Palková - LP GRAPHIC DESIGN";

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
          Nižšie nájdete informácie o tom, aké osobné údaje spracúvame pri
          vytvorení objednávky, platbe, doručení a komunikácii k objednávke.
        </Text>

        <div className="mt-10 space-y-10">
          <LegalSection title="Prevádzkovateľ">
            <Text>
              Predávajúcim a prevádzkovateľom internetového obchodu Annum je{" "}
              {BUSINESS_NAME}, IČO: 54943884, miesto podnikania: Trnavská
              664/16, 040 01 Košice, zapísaný v Živnostenskom registri
              Slovenskej republiky, číslo živnostenského registra: 820-98934.
              Annum je obchodná značka, pod ktorou predávajúci ponúka
              personalizované produkty.
            </Text>
            <Text>
              V prípade otázok k objednávke, platbe, doručeniu alebo reklamácii
              nás kontaktujte na e-mailovej adrese{" "}
              <a
                className="font-semibold text-primary"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
              .
            </Text>
          </LegalSection>

          <LegalSection title="Aké údaje spracúvame">
            <Text>
              Pri vytvorení objednávky spracúvame údaje, ktoré zadáte vo
              formulári: meno, priezvisko, e-mail, telefónne číslo, poznámku k
              objednávke, zvolený typ kalendára, počet kusov, zvolený spôsob
              doručenia, údaje o výdajnom mieste Packety, dôležité dátumy,
              nahraté fotky a technické údaje potrebné na spracovanie
              objednávky.
            </Text>

            <Text>
              Pri online platbe spracúvame aj informácie o stave platby, čísle
              objednávky, identifikátore platobnej relácie a informáciu o tom,
              či bola platba úspešná, zrušená alebo čaká na dokončenie.
            </Text>
          </LegalSection>

          <LegalSection title="Na čo údaje používame">
            <Text>
              Údaje používame na vytvorenie a spracovanie objednávky, prípravu
              personalizovaného kalendára, online platbu, doručenie alebo osobný
              odber, komunikáciu so zákazníkom a administráciu objednávky.
            </Text>

            <Text>
              E-mail používame na odoslanie informácie o vytvorení objednávky,
              odkazu na dokončenie platby, potvrdenia prijatej platby a
              informácie o pripravení objednávky na osobný odber alebo o jej
              odoslaní cez Packetu.
            </Text>

            <Text>
              Vaše údaje nepoužívame na marketingové účely bez samostatného
              súhlasu.
            </Text>
          </LegalSection>

          <LegalSection title="Právny základ spracúvania">
            <Text>
              Osobné údaje spracúvame najmä preto, aby sme mohli vybaviť vašu
              objednávku a splniť zmluvu. Niektoré údaje môžeme spracúvať aj z
              dôvodu plnenia zákonných povinností, napríklad účtovných alebo
              daňových povinností.
            </Text>

            <Text>
              Technické a bezpečnostné údaje môžeme spracúvať na základe
              oprávneného záujmu, napríklad pri ochrane formulára pred spamom,
              zneužitím alebo neoprávneným prístupom.
            </Text>
          </LegalSection>

          <LegalSection title="Nahraté fotky">
            <Text>
              Nahraté fotky slúžia iba na prípravu objednaného kalendára.
              Nepoužívame ich na verejnú prezentáciu, reklamu ani sociálne siete
              bez vášho výslovného súhlasu.
            </Text>

            <Text>
              Zákazník zodpovedá za to, že má právo nahraté fotky použiť na
              vytvorenie kalendára a že ich použitím neporušuje práva tretích
              osôb.
            </Text>
          </LegalSection>

          <LegalSection title="Platby">
            <Text>
              Online platby spracúva platobná služba Stripe. Platobné údaje,
              napríklad celé číslo platobnej karty, nespracúvame ani neukladáme
              priamo v našej aplikácii. Dostávame iba informácie potrebné na
              potvrdenie stavu platby k objednávke.
            </Text>
          </LegalSection>

          <LegalSection title="Doručenie a Packeta">
            <Text>
              Ak si zvolíte doručenie cez Packetu, spracúvame údaje o vybranom
              výdajnom mieste alebo Z-BOXe, napríklad názov, adresu a
              identifikátor výdajného miesta.
            </Text>

            <Text>
              Tieto údaje používame na prípravu a odoslanie zásielky. Pri
              osobnom odbere v Košiciach spracúvame informáciu o tom, že ste si
              zvolili osobný odber.
            </Text>
          </LegalSection>

          <LegalSection title="Cookies">
            <Text>
              Na webe používame cookies na zabezpečenie prevádzky stránky,
              spracovanie objednávky, ochranu formulára a, ak udelíte súhlas,
              aj na analytické alebo marketingové účely.
            </Text>

            <Text>
              Pri prvej návšteve vám zobrazíme cookie lištu, kde môžete
              prijať všetky cookies, odmietnuť nepovinné cookies alebo si
              nastavenia upraviť.
            </Text>

            <div
              id="cookies"
              className="scroll-mt-24 rounded-xl border border-[#EAD6DE] bg-[#FFF7F4] p-4 md:p-6"
            >
              <CookiebotDeclaration />
            </div>
          </LegalSection>

          <LegalSection title="Služby tretích strán">
            <Text>
              Pri spracovaní objednávky môžeme používať technické služby tretích
              strán, napríklad databázu, úložisko nahratých fotiek, e-mailovú
              službu, platobnú bránu, ochranu formulára pred spamom a
              doručovaciu službu.
            </Text>

            <Text>
              Ide najmä o služby potrebné na prevádzku webu, uloženie
              objednávky, odoslanie e-mailov, spracovanie platby a doručenie
              zásielky.
            </Text>
          </LegalSection>

          <LegalSection title="Uchovávanie údajov">
            <Text>
              Údaje uchovávame po dobu potrebnú na vybavenie objednávky,
              doručenie alebo osobný odber, riešenie prípadnej komunikácie a
              následnú administráciu.
            </Text>

            <Text>
              Údaje, ktoré musíme uchovávať z účtovných, daňových alebo iných
              zákonných dôvodov, uchovávame po dobu vyžadovanú príslušnými
              predpismi. Nahraté fotky môžu byť po vybavení objednávky a
              uplynutí primeranej doby odstránené.
            </Text>
          </LegalSection>

          <LegalSection title="Prístup k údajom">
            <Text>
              K údajom má prístup iba osoba spracúvajúca objednávku a technické
              služby potrebné na prevádzku objednávkového systému. Údaje
              neposkytujeme tretím stranám na ich vlastné marketingové účely.
            </Text>
          </LegalSection>

          <LegalSection title="Vaše práva">
            <Text>
              Môžete nás požiadať o informáciu, aké údaje o vás spracúvame, o
              prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania
              alebo prenosnosť údajov, ak sú splnené zákonné podmienky.
            </Text>

            <Text>
              Ak sa domnievate, že vaše údaje spracúvame nesprávne, môžete nás
              kontaktovať alebo sa obrátiť na príslušný dozorný orgán na ochranu
              osobných údajov.
            </Text>
          </LegalSection>

          <LegalSection title="Kontakt">
            <Text>
              Ak máte otázky k spracovaniu osobných údajov alebo chcete požiadať
              o odstránenie údajov, kontaktujte nás e-mailom.
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
