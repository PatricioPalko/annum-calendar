import { supabaseAdmin } from "@/lib/supabase/admin";

const PACKETA_API_URL = "https://www.zasilkovna.cz/api/rest";

type CreatePacketaPacketInput = {
  orderCode: string;
  orderNumber?: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  addressId: string;
  value: number;
  weight: number;
  note?: string | null;
};

export function toPacketaPacketNumber(input: {
  orderCode: string;
  orderNumber?: number | null;
}) {
  if (input.orderNumber && input.orderNumber > 0) {
    return String(input.orderNumber).slice(0, 36);
  }

  const sanitized = input.orderCode
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 36);

  if (!sanitized) {
    throw new Error("Číslo objednávky nie je vhodné pre Packeta API.");
  }

  return sanitized;
}

function sanitizePacketaName(value: string) {
  return value.trim().slice(0, 32);
}

function sanitizePacketaNote(value: string) {
  return value.replace(/[";]/g, " ").trim().slice(0, 128);
}

export type PacketaPacketResult = {
  id: string;
  barcode: string;
  barcodeText: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatPhoneForPacketa(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("421")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+421${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith("9")) {
    return `+421${digits}`;
  }

  return phone.trim();
}

function getPacketaConfig() {
  const apiPassword = process.env.PACKETA_API_PASSWORD?.trim();
  const eshop = process.env.PACKETA_ESHOP?.trim();

  if (!apiPassword) {
    return null;
  }

  return {
    apiPassword,
    eshop,
    defaultWeight: Number(process.env.PACKETA_PACKET_WEIGHT ?? "1.5"),
  };
}

function parsePacketaAttributeFaults(xml: string) {
  const faults: string[] = [];

  for (const match of xml.matchAll(/<name>([^<]+)<\/name>\s*<fault>([^<]+)<\/fault>/g)) {
    const fieldName = match[1]?.trim();
    const fieldFault = match[2]?.trim();

    if (fieldName && fieldFault) {
      faults.push(`${fieldName}: ${fieldFault}`);
    }
  }

  return faults;
}

function toPacketaUserMessage(fault: string) {
  if (/not approved for posting parcels/i.test(fault)) {
    return "Packeta účet ešte nemá povolené odosielanie zásielok. Kontaktuj Packeta podporu alebo obchodné oddelenie a nechaj si aktivovať odosielanie v klientskej sekcii.";
  }

  if (/sender is not given|choose a sender/i.test(fault)) {
    return "Chýba alebo je nesprávna hodnota PACKETA_ESHOP. Skontroluj indikáciu odosielateľa v Packeta klientovi.";
  }

  return fault;
}

function parsePacketaResponse(xml: string) {
  const status = xml.match(/<status>([^<]+)<\/status>/)?.[1];

  if (status !== "ok") {
    const attributeFaults = parsePacketaAttributeFaults(xml);
    const fault =
      attributeFaults.join(" · ") ||
      xml.match(/<string>([^<]*)<\/string>/)?.[1]?.trim() ||
      xml.match(/<fault>([^<]*)<\/fault>/)?.[1]?.trim() ||
      "Packeta API request failed";

    throw new Error(toPacketaUserMessage(fault));
  }

  const id = xml.match(/<id>([^<]+)<\/id>/)?.[1];
  const barcode = xml.match(/<barcode>([^<]+)<\/barcode>/)?.[1];
  const barcodeText = xml.match(/<barcodeText>([^<]+)<\/barcodeText>/)?.[1];

  if (!id || !barcode) {
    throw new Error("Packeta API returned an incomplete packet response.");
  }

  return {
    id,
    barcode,
    barcodeText: barcodeText ?? barcode,
  } satisfies PacketaPacketResult;
}

export function estimatePacketaWeight(quantity: number) {
  const config = getPacketaConfig();
  const baseWeight = config?.defaultWeight ?? 1.5;

  return Math.max(0.3, Number((0.35 * quantity + 0.25).toFixed(2))) || baseWeight;
}

export async function createPacketaPacket(
  input: CreatePacketaPacketInput,
): Promise<PacketaPacketResult> {
  const config = getPacketaConfig();

  if (!config) {
    throw new Error("Chýba PACKETA_API_PASSWORD.");
  }

  if (!config.eshop) {
    throw new Error(
      "Chýba PACKETA_ESHOP. Nastav indikáciu odosielateľa z Packeta klienta (Stav odosielateľa / Indication).",
    );
  }

  const packetNumber = toPacketaPacketNumber({
    orderCode: input.orderCode,
    orderNumber: input.orderNumber,
  });
  const phone = input.phone ? formatPhoneForPacketa(input.phone) : null;

  if (!input.email && !phone) {
    throw new Error("Packeta vyžaduje e-mail alebo telefón príjemcu.");
  }

  const packetAttributes = [
    `<number>${escapeXml(packetNumber)}</number>`,
    `<name>${escapeXml(sanitizePacketaName(input.firstName))}</name>`,
    `<surname>${escapeXml(sanitizePacketaName(input.lastName))}</surname>`,
    input.email ? `<email>${escapeXml(input.email)}</email>` : "",
    phone ? `<phone>${escapeXml(phone)}</phone>` : "",
    `<addressId>${escapeXml(input.addressId)}</addressId>`,
    `<cod>0</cod>`,
    `<value>${input.value.toFixed(2)}</value>`,
    `<currency>EUR</currency>`,
    `<weight>${input.weight.toFixed(2)}</weight>`,
    `<eshop>${escapeXml(config.eshop)}</eshop>`,
    input.note
      ? `<note>${escapeXml(sanitizePacketaNote(input.note))}</note>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const requestBody = `<createPacket><apiPassword>${escapeXml(config.apiPassword)}</apiPassword><packetAttributes>${packetAttributes}</packetAttributes></createPacket>`;

  const response = await fetch(PACKETA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
    body: requestBody,
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error("PACKETA_HTTP_ERROR:", {
      status: response.status,
      body: responseText,
    });

    throw new Error(`Packeta API HTTP ${response.status}`);
  }

  try {
    return parsePacketaResponse(responseText);
  } catch (error) {
    console.error("PACKETA_API_FAULT:", {
      packetNumber,
      addressId: input.addressId,
      eshop: config.eshop,
      response: responseText,
    });

    throw error;
  }
}

export function isPacketaConfigured() {
  return Boolean(getPacketaConfig());
}

type SyncPacketaPacketForOrderInput = {
  orderId: string;
  orderCode: string;
  orderNumber?: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  packetaPointId: string;
  goodsValue: number;
  quantity: number;
  note?: string | null;
  existingTrackingNumber?: string | null;
};

export async function syncPacketaPacketForOrder(
  input: SyncPacketaPacketForOrderInput,
): Promise<PacketaPacketResult | null> {
  if (input.existingTrackingNumber?.trim()) {
    return null;
  }

  if (!isPacketaConfigured()) {
    console.warn("PACKETA_NOT_CONFIGURED: skipping packet creation.");
    return null;
  }

  try {
    const packet = await createPacketaPacket({
      orderCode: input.orderCode,
      orderNumber: input.orderNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      addressId: input.packetaPointId,
      value: input.goodsValue,
      weight: estimatePacketaWeight(input.quantity),
      note: input.note,
    });

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        tracking_number: packet.barcode,
      })
      .eq("id", input.orderId)
      .is("tracking_number", null);

    if (error) {
      console.error("PACKETA_TRACKING_UPDATE_ERROR:", error);
    }

    return packet;
  } catch (error) {
    console.error("PACKETA_CREATE_PACKET_ERROR:", {
      orderId: input.orderId,
      orderCode: input.orderCode,
      error,
    });

    return null;
  }
}
