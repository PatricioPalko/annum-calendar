import Link from "next/link";

import { CookiebotDeclaration } from "@/components/cookiebot/cookiebot-declaration";
import {
  LegalDocument,
  LegalList,
  LegalMailLink,
  LegalSubheading,
  LegalText,
} from "@/components/legal/legal-document";
import { LEGAL_UPDATED_ON, OPERATOR } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: "Ochrana osobných údajov",
  description:
    "Ako Annum spracúva osobné údaje pri objednávke fotokalendára, nahratých fotografiách, platbe, doručení a cookies.",
  path: "/ochrana-osobnych-udajov",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Ochrana osobných údajov"
      path="/ochrana-osobnych-udajov"
      updated={LEGAL_UPDATED_ON}
      lead="Tento dokument vysvetľuje, aké osobné údaje spracúvame pri objednávke personalizovaného fotokalendára, prečo ich spracúvame a aké máte práva. Nejde o súhlas so všetkým spracúvaním. Údaje potrebné na vybavenie objednávky spracúvame preto, aby sme mohli zmluvu splniť."
      sections={[
        {
          id: "prevadzkovatel",
          title: "Prevádzkovateľ",
          body: (
            <>
              <LegalText>
                Prevádzkovateľom osobných údajov je {OPERATOR.name}, IČO:{" "}
                {OPERATOR.ico}, so sídlom {OPERATOR.street}, {OPERATOR.postalCity},{" "}
                {OPERATOR.register}. Obchod pod značkou {OPERATOR.brand}{" "}
                prevádzkujeme na {OPERATOR.web}.
              </LegalText>
              <LegalText>
                V otázkach osobných údajov nám píšte na <LegalMailLink />.
              </LegalText>
            </>
          ),
        },
        {
          id: "ake-udaje",
          title: "Aké údaje spracúvame",
          body: (
            <>
              <LegalText>
                Zákaznícky účet nezakladáme. Objednávku vytvoríte vo formulári
                bez registrácie.
              </LegalText>
              <LegalSubheading>Objednávka</LegalSubheading>
              <LegalList
                items={[
                  "meno, priezvisko, e-mail a telefón,",
                  "poznámka k objednávke, ak ju vyplníte,",
                  "variant kalendára, počet kusov, zľavový kód a cena,",
                  "spôsob doručenia a pri Packete identifikátor, názov a adresa výdajného miesta alebo Z-BOXu,",
                  "pri variante Premium a Memory set mená a dátumy narodenín a vybrané mená k meninám,",
                  "pri Memory sete text venovania,",
                  "číslo a kód objednávky, čas odoslania a stav vybavenia,",
                  "čas súhlasu s obchodnými podmienkami a, ak ho dáte, čas súhlasu s e-mailovými novinkami.",
                ]}
              />
              <LegalSubheading>Fotografie</LegalSubheading>
              <LegalText>
                Nahrávate fotografie, z ktorých kalendár vyrobíme. Môžu
                zobrazovať vás, deti alebo iné osoby a môžu z nich vyplývať
                ďalšie osobné údaje. Fotografie sa ukladajú do neverejného
                úložiska. Aplikácia nevytvára verejný odkaz na návrh ani na
                hotové fotografie.
              </LegalText>
              <LegalSubheading>Platba</LegalSubheading>
              <LegalText>
                Platbu spracúva Stripe. Celé číslo platobnej karty v našej
                aplikácii neukladáme. Ukladáme stav platby, identifikátor
                platobnej relácie a identifikátor platby, aby sme vedeli, či
                je objednávka zaplatená.
              </LegalText>
              <LegalSubheading>Technické údaje</LegalSubheading>
              <LegalText>
                Pri odoslaní formulára a nahrávaní fotografií spracúvame IP
                adresu na obmedzenie počtu požiadaviek a na overenie, že
                formulár nevyplnil automatizovaný program (Cloudflare
                Turnstile). Rozpracovaný formulár bez fotografií sa ukladá v
                prehliadači v localStorage, kým objednávku nedokončíte alebo
                údaje nevymažete. Fotografie sa do tohto lokálneho konceptu
                neukladajú.
              </LegalText>
              <LegalSubheading>Firemný dopyt</LegalSubheading>
              <LegalText>
                Vo formulári na stránke Pre firmy spracúvame názov firmy, meno,
                priezvisko, e-mail, telefón, požadovaný počet kusov a
                dobrovoľnú správu. Tieto údaje sa neukladajú do databázy
                objednávok. Odošleme ich e-mailom, aby sme vedeli pripraviť
                ponuku.
              </LegalText>
            </>
          ),
        },
        {
          id: "ucely",
          title: "Účely a právne základy",
          body: (
            <>
              <LegalText>
                Jednotlivé operácie opierame o rôzne právne základy podľa
                článku 6 nariadenia (EÚ) 2016/679 (GDPR) a zákona č. 18/2018 Z.
                z.
              </LegalText>
              <LegalList
                items={[
                  "Vybavenie objednávky, výroba kalendára, platba, doručenie a súvisiaca komunikácia: plnenie zmluvy a kroky pred jej uzavretím, článok 6 ods. 1 písm. b) GDPR.",
                  "Účtovné a daňové povinnosti k prijatým platbám: plnenie zákonnej povinnosti, článok 6 ods. 1 písm. c) GDPR.",
                  "Ochrana formulára pred zneužitím, obmedzenie počtu požiadaviek a zabezpečenie neverejného úložiska: oprávnený záujem, článok 6 ods. 1 písm. f) GDPR.",
                  "E-mailové novinky o produktoch Annum: iba váš súhlas, článok 6 ods. 1 písm. a) GDPR. Súhlas nie je podmienkou objednávky.",
                  "Meranie návštevnosti cez Google Analytics: iba súhlas so štatistickými cookies, ak je na webe zapnutý Cookiebot.",
                ]}
              />
              <LegalText>
                Zaškrtnutie obchodných podmienok v objednávke nie je súhlasom
                so spracúvaním všetkých osobných údajov. Informáciu o
                spracúvaní dostávate týmto dokumentom. Údaje, bez ktorých
                objednávku nevybavíme, spracúvame na základe zmluvy.
              </LegalText>
            </>
          ),
        },
        {
          id: "objednavka",
          title: "Objednávka, platba, doručenie a reklamácia",
          body: (
            <>
              <LegalText>
                Údaje z formulára použijeme na uloženie objednávky, výpočet
                ceny, spustenie platby a e-maily o prijatí objednávky, odkaze
                na platbu, potvrdení platby a odoslaní alebo osobnom odbere.
              </LegalText>
              <LegalText>
                Pri doručení cez Packetu odovzdáme Packete meno, priezvisko,
                e-mail alebo telefón, identifikátor vybraného výdajného miesta
                a údaje o zásielke potrebné na jej podanie. Fotografie Packete
                neposielame.
              </LegalText>
              <LegalText>
                Osobný odber v Košiciach sa vo formulári zobrazí len pri
                zľavovom kóde, ktorý ho umožňuje. Inak je spôsobom doručenia
                Packeta.
              </LegalText>
              <LegalText>
                Pri reklamácii spracúvame e-mail, číslo objednávky, popis vady
                a fotografie vady, ak ich pošlete, aby sme vedeli vadu
                posúdiť.
              </LegalText>
            </>
          ),
        },
        {
          id: "fotografie",
          title: "Fotografie",
          body: (
            <>
              <LegalText>
                Fotografie spracúvame len preto, aby sme z nich pripravili,
                vytlačili a dodali objednaný kalendár a aby sme vedeli
                vybaviť reklamáciu, ktorá sa týka použitého podkladu. Právnym
                základom je plnenie zmluvy.
              </LegalText>
              <LegalText>
                Fotografie nezverejňujeme a nepoužívame ich na reklamu,
                sociálne siete ani portfólio. Také použitie by vyžadovalo
                samostatný, dobrovoľný a konkrétny súhlas. Ten v objednávke
                nepožadujeme a z objednávky nevyplýva.
              </LegalText>
              <LegalText>
                Za to, že máte právo fotografie na výrobu kalendára poskytnúť,
                zodpovedáte vy. Týka sa to aj fotografií iných osôb a detí.
                Môžeme odmietnuť podklad, ktorý je nezákonný.
              </LegalText>
              <LegalText>
                Súbory sa nahrávajú cez časovo obmedzený odkaz do neverejného
                úložiska. Nie sú určené na verejné zobrazenie. Stiahnuť ich
                môže administrátor pri vybavovaní objednávky. Aplikácia
                neponúka zdieľanie návrhu verejným odkazom a pred tlačou
                neposiela zákazníkovi náhľad na schválenie, ak ho pri
                nevhodnom podklade sami nepožiadame o doplnenie.
              </LegalText>
              <LegalText>
                Fotografie po vybavení objednávky systém sám po pevnom počte
                dní nemaže. Vymažeme ich, keď zmažeme objednávku, alebo na vašu
                žiadosť, ak už nie sú potrebné na výrobu, reklamáciu ani na
                zákonnú povinnosť.
              </LegalText>
            </>
          ),
        },
        {
          id: "prijemcovia",
          title: "Príjemcovia a sprostredkovatelia",
          body: (
            <>
              <LegalText>
                Údaje spracúvajú osoby, ktoré pre nás vybavujú objednávky.
                Ďalej ich dostávajú títo poskytovatelia, v rozsahu potrebnom na
                ich službu:
              </LegalText>
              <LegalList
                items={[
                  "Supabase: databáza objednávok a neverejné úložisko fotografií.",
                  "Stripe: online platba. Číslo karty spracúva Stripe, nie naša aplikácia.",
                  "Packeta: podanie zásielky na vybrané výdajné miesto alebo Z-BOX.",
                  "Resend: odoslanie transakčných e-mailov k objednávke a firemnému dopytu.",
                  "Cloudflare Turnstile: overenie, že formulár neodoslal automatizovaný program.",
                  "Cookiebot: lišta súhlasu s cookies, ak je v produkcii nastavené Cookiebot ID.",
                  "Google Analytics: návštevnosť stránok, len ak je zapnuté meranie a udelíte súhlas so štatistikou.",
                ]}
              />
              <LegalText>
                Údaje nepredávame a neodovzdávame ich tretím stranám na ich
                vlastný marketing. Na prípravu a tlač kalendára ich použijú
                osoby, ktoré pre nás objednávku vybavujú.
              </LegalText>
            </>
          ),
        },
        {
          id: "prenosy",
          title: "Prenosy mimo Európskeho hospodárskeho priestoru",
          body: (
            <>
              <LegalText>
                Packeta pôsobí v Európskom hospodárskom priestore. Cookiebot
                prevádzkuje poskytovateľ so sídlom v Európskom hospodárskom
                priestore.
              </LegalText>
              <LegalText>
                Stripe, Resend, Cloudflare a Google môžu údaje spracúvať aj
                mimo Európskeho hospodárskeho priestoru. Taký prenos sa opiera
                o záruky podľa kapitoly V GDPR, ktoré títo poskytovatelia
                používajú. Databázu a úložisko fotografií prevádzkuje Supabase.
                Krajina uloženia závisí od nastavenia projektu.
              </LegalText>
            </>
          ),
        },
        {
          id: "lehoty",
          title: "Ako dlho údaje uchovávame",
          body: (
            <>
              <LegalText>
                Objednávku, kontakt, zvolený variant, doručenie a stav platby
                uchovávame po dobu vybavenia objednávky, reklamácie a po dobu,
                ktorú vyžadujú účtovné a daňové predpisy. Presný počet rokov
                pre každý druh dokladu závisí od toho, či ide o účtovný záznam.
                Aplikácia tieto záznamy po pevnej lehote sama nemaže.
              </LegalText>
              <LegalText>
                Fotografie uchovávame na výrobu a na vybavenie prípadnej
                reklamácie. Automatickú lehotu ich vymazania systém nemá.
                Môžete nás požiadať o vymazanie, ak už nie sú potrebné na tieto
                účely ani na zákonnú povinnosť.
              </LegalText>
              <LegalText>
                Čas súhlasu s novinkami uchovávame, kým súhlas neodvoláte.
                Rozpracovaný formulár v prehliadači zostáva v localStorage,
                kým ho aplikácia po dokončení objednávky nezmaže alebo kým ho
                nezmažete vo svojom prehliadači. Koncept neobsahuje
                fotografie.
              </LegalText>
              <LegalText>
                Firemný dopyt zostáva v e-mailovej schránke, z ktorej
                pripravujeme ponuku, po dobu vybavenia dopytu.
              </LegalText>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies a analytika",
          body: (
            <>
              <LegalText>
                V produkcii zobrazujeme lištu Cookiebot. Nevyhnutné cookies
                slúžia na prevádzku stránky a zapamätanie voľby súhlasu.
                Štatistické cookies, vrátane Google Analytics, sa načítajú až
                po súhlase so štatistikou. Google Analytics zaznamenáva
                zobrazenie stránky, nie obsah objednávky ani fotografie.
              </LegalText>
              <LegalText>
                Súhlas s cookies môžete kedykoľvek zmeniť tlačidlom Nastavenia
                cookies v pätičke. Podrobný zoznam cookies zobrazuje vyhlásenie
                Cookiebotu nižšie, ak je Cookiebot na webe nastavený.
              </LegalText>
              <div
                id="cookies-deklaracia"
                className="scroll-mt-28 rounded-xl border border-[#EAD6DE] bg-[#FFF7F4] p-4 md:p-6"
              >
                <CookiebotDeclaration />
              </div>
            </>
          ),
        },
        {
          id: "bezpecnost",
          title: "Bezpečnosť a automatizované rozhodovanie",
          body: (
            <>
              <LegalText>
                Fotografie nie sú verejné. Nahrávajú sa cez časovo obmedzené
                odkazy a k objednávkam pristupuje prihlásený administrátor.
                Platobné údaje karty do našej databázy neukladáme. Web
                používa zabezpečené pripojenie. Neuvádzame certifikácie ani
                šifrovanie, ktoré projekt sám neprevádzkuje.
              </LegalText>
              <LegalText>
                Objednávku neschvaľujeme automatizovaným rozhodnutím s
                právnym účinkom. Cenu počíta objednávkový formulár podľa
                variantu, počtu kusov, zľavy a doručenia, aby ste ju videli
                pred platbou. Profil na reklamné cielenie nezakladáme.
              </LegalText>
            </>
          ),
        },
        {
          id: "prava",
          title: "Vaše práva",
          body: (
            <>
              <LegalText>
                Môžete nás požiadať o prístup k údajom, opravu, vymazanie,
                obmedzenie spracúvania a o prenesenie údajov, ktoré ste nám
                poskytli a ktoré spracúvame automatizovane na základe zmluvy
                alebo súhlasu. Voči spracúvaniu založenému na oprávnenom
                záujme môžete namietať.
              </LegalText>
              <LegalText>
                Súhlas s e-mailovými novinkami aj súhlas so štatistickými
                cookies môžete odvolať. Odvolanie nemá vplyv na zákonnosť
                spracúvania pred odvolaním a nie je podmienkou vybavenia už
                zaplatenej objednávky. Novinky odhlásite e-mailom na{" "}
                <LegalMailLink />. Cookies upravíte v pätičke.
              </LegalText>
              <LegalText>
                Niektoré údaje nevymažeme hneď, ak ich ešte potrebujeme na
                rozpracovanú výrobu, reklamáciu alebo zákonnú povinnosť. V
                odpovedi uvedieme dôvod.
              </LegalText>
              <LegalText>
                Žiadosť vybavíme bezplatne do jedného mesiaca. Ak je žiadosť
                zložitá alebo opakovaná, lehotu môžeme predĺžiť podľa článku
                12 GDPR a napíšeme vám o tom.
              </LegalText>
            </>
          ),
        },
        {
          id: "dozor",
          title: "Sťažnosť",
          body: (
            <>
              <LegalText>
                Ak sa domnievate, že údaje spracúvame v rozpore s predpismi,
                môžete podať sťažnosť Úradu na ochranu osobných údajov
                Slovenskej republiky, Hraničná 12, 820 07 Bratislava 27,{" "}
                <a
                  href="https://dataprotection.gov.sk/"
                  className="font-bold text-[#FC5A61] underline-offset-4 hover:underline"
                >
                  dataprotection.gov.sk
                </a>
                . Najprv nás môžete kontaktovať na <LegalMailLink />, aby sme
                vec vyriešili priamo.
              </LegalText>
            </>
          ),
        },
        {
          id: "kontakt",
          title: "Súvisiace dokumenty",
          body: (
            <>
              <LegalText>
                Podmienky kúpy sú v dokumente{" "}
                <Link
                  href="/obchodne-podmienky"
                  className="font-bold text-[#FC5A61] underline-offset-4 hover:underline"
                >
                  Obchodné podmienky
                </Link>
                .
              </LegalText>
              <LegalText>
                Tento dokument platí od {LEGAL_UPDATED_ON}. K objednávke
                ukladáme čas, kedy ste potvrdili obchodné podmienky. Platí
                znenie uverejnené v deň odoslania objednávky.
              </LegalText>
            </>
          ),
        },
      ]}
    />
  );
}
