import Link from "next/link";

import {
  LegalDocument,
  LegalList,
  LegalMailLink,
  LegalText,
} from "@/components/legal/legal-document";
import { LEGAL_UPDATED_ON, OPERATOR } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: "Obchodné podmienky",
  description:
    "Obchodné podmienky nákupu personalizovaného A3 fotokalendára Annum: cena, platba, dodanie, odstúpenie od zmluvy a reklamácie.",
  path: "/obchodne-podmienky",
});

export default function TermsPage() {
  return (
    <LegalDocument
      title="Obchodné podmienky"
      path="/obchodne-podmienky"
      updated={LEGAL_UPDATED_ON}
      lead="Tieto podmienky upravujú objednávku personalizovaného fotokalendára v internetovom obchode Annum. Kalendár vyrábame podľa fotografií a údajov, ktoré zadáte. Preto sa naň vzťahuje iný režim odstúpenia od zmluvy ako na bežný tovar na sklade. Reklamácia vady tým nie je dotknutá."
      sections={[
        {
          id: "predavajuci",
          title: "Predávajúci",
          body: (
            <>
              <LegalText>
                Predávajúcim je {OPERATOR.name}, IČO: {OPERATOR.ico}, so sídlom{" "}
                {OPERATOR.street}, {OPERATOR.postalCity}, {OPERATOR.register}.
                Obchod vedieme pod značkou {OPERATOR.brand} na adrese{" "}
                {OPERATOR.web}. Ceny v objednávke sú konečné ceny s DPH.
              </LegalText>
            </>
          ),
        },
        {
          id: "kontakt",
          title: "Kontakt a komunikácia",
          body: (
            <>
              <LegalText>
                K objednávke, platbe, dodaniu a reklamácii píšte na{" "}
                <LegalMailLink />. Odpoveď posielame na e-mail uvedený v
                objednávke.
              </LegalText>
            </>
          ),
        },
        {
          id: "produkt",
          title: "Čo si objednávate",
          body: (
            <>
              <LegalText>
                Predmetom je personalizovaný nástenný fotokalendár formátu A3
                s kovovou väzbou čiernej farby. Má titulnú stranu a 12 mesiacov.
                Pripravíme
                ho z fotografií, ktoré nahráte, vo variante, ktorý zvolíte:
              </LegalText>
              <LegalList
                items={[
                  "Basic: kalendár z fotografií bez zvýraznených menín a narodenín.",
                  "Premium: kalendár z fotografií so zvýraznenými meninami a narodeninami, ktoré zadáte.",
                  "Memory set: Premium kalendár, k tomu koláž z vybraných fotografií, venovanie na samostatnom papieri a zľavový kód 10 % na ďalší rok.",
                ]}
              />
              <LegalText>
                Grafický editor na webe nie je. Rozloženie pripravíme my.
                Pred tlačou vám neposielame náhľad na schválenie, iba ak vás
                pri nevhodných alebo neúplných podkladoch sami požiadame o
                doplnenie. Výsledok závisí od počtu, orezania a kvality
                nahratých fotografií a od údajov, ktoré zadáte.
              </LegalText>
              <LegalText>
                Nahrať môžete 14 až 52 fotografií vo formáte JPG, PNG alebo
                WEBP. Jedna fotografia môže mať najviac 10 MB. V cene
                kalendára je príprava, tlač a zabalenie. Doručenie cez Packetu
                je v súhrne uvedené osobitne.
              </LegalText>
            </>
          ),
        },
        {
          id: "objednavka",
          title: "Objednávka a uzavretie zmluvy",
          body: (
            <>
              <LegalText>
                Objednávku odošlete formulárom na stránke Objednávka. Pred
                odoslaním vidíte variant, počet kusov, cenu, doručenie a
                očakávaný termín várky. Odoslaním návrhu potvrdzujete, že ste
                si prečítali tieto podmienky.
              </LegalText>
              <LegalText>
                Po odoslaní objednávku uložíme a presmerujeme vás na platbu.
                E-mailom dostanete číslo objednávky a odkaz na dokončenie
                platby. Kúpnou zmluvou sa objednávka stáva až potvrdením
                úspešnej platby. Do zaplatenia s výrobou nezačíname.
              </LegalText>
              <LegalText>
                Ak platbu nedokončíte, objednávka zostane uložená a fotografie
                nemusíte nahrávať znova. Zaplatíte odkazom z e-mailu alebo zo
                stránky po návrate zo zrušenej platby. Nezaplatenú objednávku
                nie sme povinní držať neobmedzene; kým ju nevymažeme, odkaz na
                platbu môžete použiť.
              </LegalText>
              <LegalText>
                Zmluvu uzatvárame v slovenčine. Znenie podmienok platné v deň
                odoslania objednávky je znenie uverejnené na tejto stránke.
                Čas potvrdenia podmienok ukladáme k objednávke.
              </LegalText>
            </>
          ),
        },
        {
          id: "cena",
          title: "Cena, doprava a platba",
          body: (
            <>
              <LegalText>
                Cena závisí od variantu a počtu kusov. Pri väčšom počte
                rovnakých kalendárov je cena za kus nižšia. Zľavový kód, ak je
                platný, znižuje cenu produktu. Cenu doručenia neznižuje, ak to
                súhrn pred platbou výslovne neukáže.
              </LegalText>
              <LegalText>
                Doručenie cez Packetu na výdajné miesto alebo Z-BOX na
                Slovensku sa účtuje sumou zobrazenou v súhrne pred platbou.
                Iné poplatky, ktoré by neboli v súhrne, neúčtujeme.
              </LegalText>
              <LegalText>
                Platíte online cez Stripe spôsobom, ktorý platobná stránka
                ponúkne. Objednávka je uhradená, keď Stripe potvrdí úspešnú
                platbu. Potom dostanete potvrdzujúci e-mail.
              </LegalText>
            </>
          ),
        },
        {
          id: "podklady",
          title: "Fotografie a ďalšie podklady",
          body: (
            <>
              <LegalText>
                Zodpovedáte za správnosť mena, kontaktu, variantu, počtu
                kusov, menín, narodenín a venovania a za to, že fotografie
                smiete použiť na výrobu kalendára. Týka sa to aj fotografií
                iných osôb a detí.
              </LegalText>
              <LegalText>
                Fotografie použijeme len na výrobu objednaného kalendára a na
                vybavenie reklamácie. Nedávate nám nimi súhlas na reklamu,
                sociálne siete ani portfólio.
              </LegalText>
              <LegalText>
                Ak sú fotografie technicky nepoužiteľné, neúplné alebo v
                rozpore so zákonom, vyzveme vás na doplnenie alebo objednávku
                nevyrobíme. Nezákonný obsah môžeme odmietnuť.
              </LegalText>
            </>
          ),
        },
        {
          id: "dodanie",
          title: "Výroba a dodacia lehota",
          body: (
            <>
              <LegalText>
                Výrobu zaradíme po zaplatení do várky, ktorú formulár ukáže v
                súhrne pred platbou. Termín odoslania je termín tejto várky.
                Aktuálne várky sú aj na úvodnej stránke v časti Termíny
                doručenia. Ak pre daný deň nie je vypísaná osobitná várka,
                platí odhad zobrazený vo formulári, inak orientačne do štyroch
                týždňov od zaplatenia.
              </LegalText>
              <LegalText>
                Lehota sa predlžuje o čas, kým nedodáte podklady, o ktoré vás
                po zaplatení požiadame. O odoslaní cez Packetu píšeme e-mail.
                Ak je k dispozícii sledovacie číslo, pošleme ho v ňom.
              </LegalText>
              <LegalText>
                Ak kalendár nedodáme v dohodnutej lehote, napíšte nám. Pri
                omeškaní máte práva podľa § 613 Občianskeho zákonníka, vrátane
                odstúpenia od zmluvy v prípadoch, ktoré toto ustanovenie
                vymenúva. Dohodnutá lehota je lehota várky zobrazenej pred
                platbou, nie všeobecná lehota 30 dní, pretože sa na inom
                termíne pred odoslaním objednávky dohodneme.
              </LegalText>
            </>
          ),
        },
        {
          id: "dorucenie",
          title: "Packeta a osobný odber",
          body: (
            <>
              <LegalText>
                Bežná objednávka ide cez Packetu na výdajné miesto alebo
                Z-BOX, ktoré vo formulári vyberiete. Osobný odber v Košiciach
                ponúkame len vtedy, keď ho formulár pri danej objednávke
                zobrazí. Miesto a čas odberu dohodneme e-mailom. Samostatnú
                predajňu s úradnými hodinami neuverejňujeme.
              </LegalText>
              <LegalText>
                Všetky kusy z objednávky posielame v jednom balíku.
              </LegalText>
              <LegalText>
                Nebezpečenstvo poškodenia prechádza odovzdaním zásielky vám
                alebo osobe, ktorá ju za vás prevezme na výdajnom mieste. Pri
                osobnom odbere prechádza prevzatím.
              </LegalText>
            </>
          ),
        },
        {
          id: "zmeny",
          title: "Zmena a zrušenie pred výrobou",
          body: (
            <>
              <LegalText>
                Údaje, doručenie alebo podklady vieme upraviť len dovtedy, kým
                nezačneme kalendár vyrábať. Napíšte čo najskôr na{" "}
                <LegalMailLink /> a uveďte číslo objednávky.
              </LegalText>
              <LegalText>
                Ak o zrušenie požiadate e-mailom skôr, ako začneme výrobu,
                potvrdíme vám e-mailom, či objednávku ešte vieme zrušiť. Ak
                zrušenie potvrdíme, prijatú platbu vrátime rovnakým spôsobom,
                akým bola zaplatená. Výrobou sa rozumie zaradenie podkladov do
                prípravy tlače, nie samotné uloženie objednávky.
              </LegalText>
            </>
          ),
        },
        {
          id: "odstupenie",
          title: "Odstúpenie od zmluvy bez uvedenia dôvodu",
          body: (
            <>
              <LegalText>
                Pri zmluve uzavretej na diaľku má spotrebiteľ podľa § 19 ods. 1
                zákona č. 108/2024 Z. z. v znení účinnom od 27. septembra 2026
                právo odstúpiť od zmluvy do 14 dní aj bez uvedenia dôvodu.
                Toto právo sa neuplatní, ak je predmetom dodanie tovaru
                vyrobeného podľa špecifikácií spotrebiteľa alebo tovaru
                vyrobeného na mieru, § 19 ods. 1 písm. c) tohto zákona.
              </LegalText>
              <LegalText>
                Fotokalendár Annum vyrábame z vašich fotografií a podľa
                zvoleného variantu, menín, narodenín alebo venovania. Nie je
                to tovar pripravený vopred na sklad. Preto sa na túto zmluvu
                nevzťahuje právo odstúpiť od nej do 14 dní len preto, že ste
                si nákup rozmysleli.
              </LegalText>
              <LegalText>
                Táto výnimka neruší reklamáciu. Ak je kalendár vadný, poškodený,
                vytlačený v inom variante, ako ste zaplatili, alebo inak nie je
                v súlade s objednávkou, práva zo zodpovednosti za vady zostávajú
                zachované.
              </LegalText>
            </>
          ),
        },
        {
          id: "reklamacia",
          title: "Reklamácia a zodpovednosť za vady",
          body: (
            <>
              <LegalText>
                Zodpovedáme za vadu, ktorú má kalendár pri dodaní a ktorá sa
                prejaví do dvoch rokov od dodania, § 619 ods. 1 Občianskeho
                zákonníka. Ide o zákonnú zodpovednosť za súlad tovaru so
                zmluvou, nie o dobrovoľnú záruku. Dobrovoľnú záruku nad tento
                rozsah neposkytujeme.
              </LegalText>
              <LegalText>
                Vadu vytknite do dvoch mesiacov od jej zistenia, najneskôr do
                uplynutia dvojročnej doby, § 621 ods. 3 Občianskeho zákonníka.
                Napíšte na <LegalMailLink />, uveďte číslo objednávky, popis
                vady a podľa možnosti fotografiu. Vytknutie e-mailom je
                vytknutie prostriedkami diaľkovej komunikácie. Potvrdenie o
                vytknutí vám pošleme a uvedieme v ňom lehotu vybavenia. Tá
                nemá byť dlhšia ako 30 dní, ak dlhšiu lehotu neodôvodňuje
                objektívny dôvod, ktorý nevieme ovplyvniť, § 622 ods. 3
                Občianskeho zákonníka.
              </LegalText>
              <LegalText>
                Môžete si zvoliť opravu alebo výmenu, ak je zvolený spôsob
                možný a nespôsobí nám neprimerané náklady v porovnaní s druhým
                spôsobom, § 623 Občianskeho zákonníka. Primeranú zľavu z ceny
                alebo odstúpenie od zmluvy pre vadu môžete žiadať v prípadoch
                podľa § 624, najmä ak vadu neodstránime, odmietneme ju
                odstrániť, sa rovnaká vada vráti, alebo je vada natoľko
                závažná, že okamžitú zľavu alebo odstúpenie odôvodňuje. Od
                zmluvy pre vadu nemožno odstúpiť, ak je vada zanedbateľná
                alebo ak ste sa na jej vzniku podieľali. Dôkaz o tom nesie
                predávajúci.
              </LegalText>
              <LegalText>
                Vadou nie je výsledok, ktorý zodpovedá nahratým fotografiám a
                zadaným údajom. Nezodpovedáme za nízke rozlíšenie, orezanie
                alebo obsah, ktorý ste nám sami poslali, ak sme ho použili
                podľa objednávky. Zodpovedáme za chybu tlače, poškodenie,
                neúplný kalendár, inú väzbu, iný variant a iný nesúlad s tým,
                čo ste si objednali a zaplatili.
              </LegalText>
            </>
          ),
        },
        {
          id: "prava-stran",
          title: "Práva a povinnosti",
          body: (
            <>
              <LegalText>
                Vy ste povinní uviesť pravdivé kontaktné údaje, zaplatiť cenu
                zobrazenú pred platbou a poskytnúť podklady, ktoré smiete
                použiť. My sme povinní vyrobiť kalendár podľa zaplateného
                variantu a podkladov, dodať ho dohodnutým spôsobom a vybaviť
                vadu podľa zákona.
              </LegalText>
              <LegalText>
                Žiadne ustanovenie týchto podmienok nevylučuje zodpovednosť za
                vadu, škodu na živote alebo zdraví ani iné právo, ktoré nemožno
                platne obmedziť.
              </LegalText>
            </>
          ),
        },
        {
          id: "firmy",
          title: "Objednávky pre firmy",
          body: (
            <>
              <LegalText>
                Od 10 kusov môžete poslať nezáväzný dopyt na stránke{" "}
                <Link
                  href="/pre-firmy"
                  className="font-bold text-[#FC5A61] underline-offset-4 hover:underline"
                >
                  Pre firmy
                </Link>
                . Dopyt nie je objednávka a kúpnu zmluvu neuzatvára. Cenu,
                termín, fakturáciu a rozsah, napríklad logo, potvrdíme
                osobitne. Kým písomne nepotvrdíme ponuku a jej prijatie, platí
                pre firemný odber táto osobitná dohoda, nie automatická cena z
                formulára pre jednotlivcov.
              </LegalText>
              <LegalText>
                Ak formulár pre jednotlivcov objednávku na 10 a viac kusov
                technicky prijme, uzavrie sa zmluva podľa týchto podmienok a
                ceny zobrazenej pred platbou.
              </LegalText>
            </>
          ),
        },
        {
          id: "spory",
          title: "Riešenie sporov",
          body: (
            <>
              <LegalText>
                Ak s vybavením reklamácie alebo s iným právom spotrebiteľa
                nesúhlasíte, pošlite nám najprv žiadosť o nápravu na{" "}
                <LegalMailLink />. Ak žiadosť odmietneme, oznámime vám to a
                uvedieme subjekt alternatívneho riešenia sporu.
              </LegalText>
              <LegalText>
                Na spory z predaja tovaru, ktoré nepatria špecializovanému
                regulátorovi, je subjektom alternatívneho riešenia
                spotrebiteľských sporov Slovenská obchodná inšpekcia,{" "}
                <a
                  href="https://www.soi.sk/"
                  className="font-bold text-[#FC5A61] underline-offset-4 hover:underline"
                >
                  www.soi.sk
                </a>
                . Návrh sa podáva podľa zákona č. 391/2015 Z. z. Platforma
                Európskej komisie na riešenie sporov online už nie je v
                prevádzke, preto na ňu neodkazujeme.
              </LegalText>
              <LegalText>
                Tieto podmienky sa riadia právom Slovenskej republiky. Tým nie
                je dotknutá ochrana, ktorú spotrebiteľovi dáva právo štátu jeho
                obvyklého bydliska, ak ju nemožno zmluvou odňať.
              </LegalText>
            </>
          ),
        },
        {
          id: "udaje",
          title: "Ochrana osobných údajov",
          body: (
            <LegalText>
              Ako spracúvame kontakt, fotografie, platbu a cookies, je v
              dokumente{" "}
              <Link
                href="/ochrana-osobnych-udajov"
                className="font-bold text-[#FC5A61] underline-offset-4 hover:underline"
              >
                Ochrana osobných údajov
              </Link>
              .
            </LegalText>
          ),
        },
        {
          id: "zaver",
          title: "Záverečné ustanovenia",
          body: (
            <>
              <LegalText>
                Podmienky sú účinné od {LEGAL_UPDATED_ON} a vzťahujú sa na
                objednávky odoslané v tento deň a neskôr. Na skôr uzavretú
                zmluvu sa použije znenie účinné v deň jej uzavretia, ak zákon
                neustanovuje inak.
              </LegalText>
              <LegalText>
                Ak by bolo niektoré ustanovenie neplatné, ostatné zostávajú v
                platnosti. Neplatné ustanovenie sa nahradí tým zákonným
                pravidlom, ktoré mu je najbližšie.
              </LegalText>
              <LegalText>
                Orgánom dohľadu nad ochranou spotrebiteľa je Slovenská
                obchodná inšpekcia.
              </LegalText>
            </>
          ),
        },
      ]}
    />
  );
}
