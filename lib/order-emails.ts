// src/lib/order-emails.ts

import { resend } from "@/lib/resend";

type UploadedPhoto = {
  name: string;
  type: string;
  size: number;
  path: string;
};

type SendOrderEmailsParams = {
  orderId: string;
  orderCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  type: string;
  quantity: number;
  photos: UploadedPhoto[];
  note?: string | null;
  totalPrice: number | null;
};

const emailFrom = process.env.EMAIL_FROM!;
const adminEmail = process.env.ADMIN_EMAIL!;

function formatPrice(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function getCalendarTypeLabel(type: string) {
  switch (type) {
    case "basic":
      return "Basic";
    case "premium":
      return "Premium";
    case "business":
      return "Business";
    default:
      return type;
  }
}

export async function sendOrderEmails({
  orderId,
  orderCode,
  firstName,
  lastName,
  email,
  phone,
  type,
  quantity,
  photos,
  note,
  totalPrice,
}: SendOrderEmailsParams) {
  await Promise.all([
    resend.emails.send({
      from: emailFrom,
      to: email,
      subject: `Objednávka ${orderCode} bola prijatá`,
      html: `
  <div style="font-family: Arial, sans-serif; color: #3E0F28; line-height: 1.6; max-width: 560px; margin: 0 auto;">
    <h1 style="margin: 0 0 16px;">
      Objednávka bola prijatá
    </h1>

    <p>Dobrý deň, ${firstName},</p>

    <p>
      ďakujeme za objednávku. Vaše fotky a údaje sme prijali. Podklady teraz spracujeme a ozveme sa Vám, keď bude kalendár pripravený.
    </p>

    <div style="margin: 24px 0; padding: 16px; background: #FFF7F4; border: 1px solid #EAD6DE; border-radius: 12px;">
      <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #FC5A61; font-weight: 700;">
        Číslo objednávky
      </p>
      <p style="margin: 4px 0 0; font-size: 22px; font-weight: 800;">
        ${orderCode}
      </p>
    </div>

    <h2 style="font-size: 18px; margin: 24px 0 12px;">
      Súhrn objednávky
    </h2>

    <div style="margin: 0 0 24px;">
      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Typ kalendára
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${getCalendarTypeLabel(type)}
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Počet kusov
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${quantity} ks
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Počet nahraných fotiek
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${photos.length}
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Cena
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
            ${totalPrice !== null ? formatPrice(totalPrice) : "Cena na mieru"}
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Kontaktné údaje
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${firstName} ${lastName}
          <br />
          ${email}
          <br />
          ${phone || "—"}
        </p>
      </div>
    </div>

    <p>
      Ak budete mať otázky, stačí odpovedať na tento e-mail. Do správy uveďte aj číslo Vašej objednávky <strong>${orderCode}</strong>, aby sme Vás mohli rýchlejšie identifikovať.
    </p>

    <p style="margin-top: 24px;">
      Annum.
    </p>
  </div>
`,
    }),

    resend.emails.send({
      from: emailFrom,
      to: adminEmail,
      subject: `Nová objednávka: ${orderCode}`,
      html: `
  <div style="font-family: Arial, sans-serif; color: #3E0F28; line-height: 1.6; max-width: 560px; margin: 0 auto;">
    <h1 style="margin: 0 0 16px;">
      Nová objednávka
    </h1>

    <div style="margin: 24px 0; padding: 16px; background: #FFF7F4; border: 1px solid #EAD6DE; border-radius: 12px;">
      <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #FC5A61; font-weight: 700;">
        Číslo objednávky
      </p>
      <p style="margin: 4px 0 0; font-size: 22px; font-weight: 800;">
        ${orderCode}
      </p>
    </div>

    <h2 style="font-size: 18px; margin: 24px 0 12px;">
      Údaje zákazníka
    </h2>

    <div>
      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Zákazník
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${firstName} ${lastName}
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          E-mail
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${email}
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Telefón
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${phone || "—"}
        </p>
      </div>
    </div>

    <h2 style="font-size: 18px; margin: 24px 0 12px;">
      Súhrn objednávky
    </h2>

    <div>
      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Typ kalendára
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${getCalendarTypeLabel(type)}
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Počet kusov
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${quantity} ks
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Počet fotiek
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${photos.length}
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Poznámka
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
          ${note || "—"}
        </p>
      </div>

      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Cena
        </p>
        <p style="margin: 2px 0 0; font-weight: 700;">
            ${totalPrice !== null ? formatPrice(totalPrice) : "Cena na mieru"}
        </p>
      </div>
    </div>

    <p style="margin-top: 24px;">
      Objednávku nájdeš v admin paneli.
    </p>
  </div>
`,
    }),
  ]);
}
