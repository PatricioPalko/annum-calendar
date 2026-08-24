export const MIN_PHOTOS = 14;
export const MAX_PHOTOS = 52;
export const MAX_BIRTHDAY_NAME_LENGTH = 15;

export const ORDER_HANGING_SET_LABEL = "Set na zavesenie";

export const ORDER_HANGING_SET_DETAILS =
  "2× strieborný klinček na zavesenie, 1× samolepiaci háčik v čiernej farbe";

export const ORDER_HANGING_SET_INCLUSION = `${ORDER_HANGING_SET_LABEL} (${ORDER_HANGING_SET_DETAILS})`;

export const ORDER_HANGING_SET_SUMMARY_ITEMS = [
  "2× strieborný klinček na zavesenie",
  "1× samolepiaci háčik v bielej farbe",
] as const;

export const MEMORY_SET_PRICE = 49;

export const MEMORY_SET_UNIT_PRICE_FROM_3 = 45;

export const MEMORY_SET_UNIT_PRICE_FROM_5 = 39;

export const MEMORY_SET_PACK_PRICES = {
  1: MEMORY_SET_PRICE,
  3: MEMORY_SET_UNIT_PRICE_FROM_3 * 3,
  5: MEMORY_SET_UNIT_PRICE_FROM_5 * 5,
} as const;

export const MEMORY_SET_LABEL = "Memory set";

export const MAX_DEDICATION_LENGTH = 200;

export const MEMORY_SET_FEATURES = [
  "A3 koláž z vybraných fotiek (jednoduché založenie do rámu)",
  "Osobné venovanie na samostatnom papieri",
  "10 % zľavový kód na ďalší rok",
] as const;

export const ORDER_SHARED_INCLUSIONS = [
  "Personalizovaný fotokalendár vo formáte A3 s kovovou väzbou čiernej farby",
  "13 strán (titulná strana + 12 mesiacov)",
  "Vaše fotky rozložené do 12 mesiacov (min. 14, odporúčame 30+)",
  "Príprava, tlač a pekné zabalenie v cene",
  ORDER_HANGING_SET_INCLUSION,
  "Doručenie cez Packetu sa účtuje samostatne",
  "Súčasťou balenia je aj fixka na zapisovanie poznámok",
  "Darčekovo zabalené, vhodné na darovanie",
] as const;

export const BASIC_PRICING_FEATURES = [
  "A3 fotokalendár s vašimi fotkami na 12 mesiacov",
  "Profesionálne rozloženie fotiek a príprava na tlač",
  "Pekné zabalenie",
  "Bez zvýraznených menín a narodenín",
] as const;

export const PREMIUM_PRICING_FEATURES = [
  "Všetko z balíka Basic",
  "Vybrané meniny zvýraznené v kalendári",
  "Vybrané narodeniny s menom pri dátume",
  "Dátumy jednoducho zadáte v objednávke",
] as const;

export const MEMORY_SET_PRICING_FEATURES = [
  "Všetko z balíka Premium",
  ...MEMORY_SET_FEATURES,
] as const;
