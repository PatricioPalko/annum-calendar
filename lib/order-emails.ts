import {
  formatWaveDeliveryBy,
  getDeliveryWaveByKey,
} from "@/lib/order/delivery-waves";
import { MEMORY_SET_LABEL } from "@/lib/order/config";
import { resend } from "@/lib/resend";

const emailFrom = process.env.EMAIL_FROM!;
const adminEmail = process.env.ADMIN_EMAIL!;

type DeliveryMethod = "pickup" | "packeta";
type CalendarType = "basic" | "premium" | "memory" | "business";

type DeliveryInfo = {
  method: DeliveryMethod;
  price: number;
  packetaPoint?: {
    id: string;
    name: string;
    address: string;
  } | null;
};

type OrderSummary = {
  orderCode: string;
  calendarType: CalendarType;
  quantity: number;
  totalPrice: number | null;
  goodsPrice?: number | null;
  discountCode?: string | null;
  discountAmount?: number | null;
  delivery: DeliveryInfo;
  deliveryWaveKey?: string | null;
  photoCount?: number;
  birthdaysCount?: number;
  namedaysCount?: number;
  dedications?: string[];
  note?: string | null;
};

type CustomerInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
};

type SendOrderCreatedEmailParams = CustomerInfo &
  OrderSummary & {
    paymentUrl: string;
  };

type SendOrderPaidEmailParams = CustomerInfo & OrderSummary;

type SendOrderFulfillmentEmailParams = {
  orderCode: string;
  firstName: string;
  email: string;
  delivery: DeliveryInfo;
  trackingNumber?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPrice(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function getCalendarTypeLabel(type: CalendarType | string) {
  switch (type) {
    case "basic":
      return "Basic";
    case "premium":
      return "Premium";
    case "memory":
      return MEMORY_SET_LABEL;
    case "business":
      return "Business";
    default:
      return "Kalendár";
  }
}

function getDeliveryLabel(method: DeliveryMethod) {
  switch (method) {
    case "packeta":
      return "Packeta";
    case "pickup":
    default:
      return "Osobný odber v Košiciach";
  }
}

function renderEmailShell(title: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #3E0F28; line-height: 1.6; max-width: 560px; margin: 0 auto;">
      <h1 style="margin: 0 0 16px;">${title}</h1>
      ${body}
    </div>
  `;
}

function renderOrderCodeBlock(orderCode: string) {
  const safeOrderCode = escapeHtml(orderCode);

  return `
    <div style="margin: 24px 0; padding: 16px; background: #FFF7F4; border: 1px solid #EAD6DE; border-radius: 12px;">
      <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #FC5A61; font-weight: 700;">
        Číslo objednávky
      </p>
      <p style="margin: 4px 0 0; font-size: 22px; font-weight: 800;">
        ${safeOrderCode}
      </p>
    </div>
  `;
}

function renderDetailRow(label: string, value: string) {
  return `
    <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
      <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
        ${escapeHtml(label)}
      </p>
      <p style="margin: 2px 0 0; font-weight: 700;">
        ${value}
      </p>
    </div>
  `;
}

function renderDeliveryHtml(delivery: DeliveryInfo) {
  const safeDeliveryLabel = escapeHtml(getDeliveryLabel(delivery.method));
  const deliveryPrice =
    delivery.price > 0 ? ` · ${formatPrice(delivery.price)}` : "";

  if (delivery.method === "packeta" && delivery.packetaPoint) {
    return `
      ${renderDetailRow("Doručenie", `${safeDeliveryLabel}${deliveryPrice}`)}
      <div style="padding: 0 0 10px; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.72);">
          ${escapeHtml(delivery.packetaPoint.name)}<br />
          ${escapeHtml(delivery.packetaPoint.address)}
        </p>
        <p style="margin: 4px 0 0; font-size: 12px; color: rgba(62, 15, 40, 0.45);">
          ID výdajného miesta: ${escapeHtml(delivery.packetaPoint.id)}
        </p>
      </div>
    `;
  }

  return renderDetailRow("Doručenie", `${safeDeliveryLabel}${deliveryPrice}`);
}

function renderDeliveryWaveHtml(deliveryWaveKey?: string | null) {
  const wave = getDeliveryWaveByKey(deliveryWaveKey);

  if (!wave) {
    return "";
  }

  return `
    ${renderDetailRow("Výrobná várka", escapeHtml(wave.customerHeadline))}
    ${renderDetailRow("Odoslanie do", escapeHtml(formatWaveDeliveryBy(wave)))}
  `;
}

function renderOrderSummaryHtml(summary: OrderSummary) {
  const calendarLabel = escapeHtml(getCalendarTypeLabel(summary.calendarType));
  const hasDiscount =
    summary.discountCode &&
    summary.discountAmount &&
    summary.discountAmount > 0;

  return `
    <div style="margin: 24px 0;">
      ${renderDetailRow("Kalendár", calendarLabel)}
      ${renderDetailRow("Počet kusov", escapeHtml(String(summary.quantity)))}
      ${
        summary.goodsPrice !== null && summary.goodsPrice !== undefined
          ? renderDetailRow("Cena kalendárov", formatPrice(summary.goodsPrice))
          : ""
      }
      ${
        hasDiscount
          ? renderDetailRow(
              "Zľavový kód",
              `${escapeHtml(summary.discountCode!)} · -${formatPrice(summary.discountAmount!)}`,
            )
          : ""
      }
      ${renderDeliveryHtml(summary.delivery)}
      ${renderDeliveryWaveHtml(summary.deliveryWaveKey)}
      ${
        summary.totalPrice !== null
          ? renderDetailRow("Celková suma", formatPrice(summary.totalPrice))
          : renderDetailRow("Celková suma", "Cena na mieru")
      }
      ${
        summary.photoCount !== undefined
          ? renderDetailRow(
              "Počet fotiek",
              escapeHtml(String(summary.photoCount)),
            )
          : ""
      }
      ${
        summary.birthdaysCount
          ? renderDetailRow(
              "Dôležité narodeniny",
              escapeHtml(String(summary.birthdaysCount)),
            )
          : ""
      }
      ${
        summary.namedaysCount
          ? renderDetailRow(
              "Dôležité meniny",
              escapeHtml(String(summary.namedaysCount)),
            )
          : ""
      }
      ${renderDedicationsHtml(summary.dedications)}
      ${
        summary.note
          ? renderDetailRow("Poznámka", escapeHtml(summary.note))
          : ""
      }
    </div>
  `;
}

function renderDedicationsHtml(dedications: string[] | undefined) {
  if (!dedications?.length) {
    return "";
  }

  const entries = dedications
    .map((entry, index) => ({
      index: index + 1,
      text: entry.trim(),
    }))
    .filter((entry) => entry.text.length > 0);

  if (entries.length === 0) {
    return "";
  }

  if (entries.length === 1 && dedications.length === 1) {
    return renderDetailRow(
      "Venovanie (na samostatnom papieri)",
      escapeHtml(entries[0].text),
    );
  }

  return entries
    .map((entry) =>
      renderDetailRow(
        `Venovanie ${entry.index} (na samostatnom papieri)`,
        escapeHtml(entry.text),
      ),
    )
    .join("");
}

function renderCustomerHtml(customer: CustomerInfo) {
  const safeFirstName = escapeHtml(customer.firstName);
  const safeLastName = escapeHtml(customer.lastName);
  const safeEmail = escapeHtml(customer.email);
  const safePhone = customer.phone ? escapeHtml(customer.phone) : null;

  return `
    <div style="margin: 24px 0; padding: 16px; background: #FFF7F4; border: 1px solid #EAD6DE; border-radius: 12px;">
      <p style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #FC5A61; font-weight: 700;">
        Údaje zákazníka
      </p>
      ${renderDetailRow("Meno", `${safeFirstName} ${safeLastName}`)}
      ${renderDetailRow("E-mail", safeEmail)}
      ${safePhone ? renderDetailRow("Telefón", safePhone) : ""}
    </div>
  `;
}

function renderSignature() {
  return `
    <p style="margin-top: 24px;">
      Ďakujeme,<br />
      Annum
    </p>
  `;
}

export async function sendOrderCreatedEmail({
  orderCode,
  firstName,
  lastName,
  email,
  phone,
  totalPrice,
  paymentUrl,
  calendarType,
  quantity,
  goodsPrice,
  discountCode,
  discountAmount,
  delivery,
  deliveryWaveKey,
  photoCount,
  birthdaysCount,
  namedaysCount,
  dedications,
  note,
}: SendOrderCreatedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePaymentUrl = escapeHtml(paymentUrl);
  const summary: OrderSummary = {
    orderCode,
    calendarType,
    quantity,
    totalPrice,
    goodsPrice,
    discountCode,
    discountAmount,
    delivery,
    deliveryWaveKey,
    photoCount,
    birthdaysCount,
    namedaysCount,
    dedications,
    note,
  };

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: `Objednávka ${orderCode} čaká na platbu`,
    html: renderEmailShell(
      "Objednávka čaká na platbu",
      `
        <p>Dobrý deň, ${safeFirstName},</p>

        <p>
          ďakujeme za objednávku kalendára spomienok. Objednávku sme prijali
          a na prípravu ju zaradíme hneď po úspešnej platbe.
        </p>

        ${renderOrderCodeBlock(orderCode)}
        ${renderOrderSummaryHtml(summary)}

        <p>
          Dokončite prosím platbu cez tento odkaz:
        </p>

        <p style="margin: 24px 0;">
          <a href="${safePaymentUrl}" style="display: inline-block; background: #3E0F28; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 700;">
            Zaplatiť objednávku
          </a>
        </p>

        <p style="font-size: 13px; color: rgba(62, 15, 40, 0.65);">
          Ak tlačidlo nefunguje, skopírujte tento odkaz do prehliadača:<br />
          ${safePaymentUrl}
        </p>

        <p style="margin-top: 20px; font-size: 14px; color: rgba(62, 15, 40, 0.72);">
          Po prijatí platby Vám pošleme potvrdenie. Keď bude kalendár pripravený
          alebo odoslaný, dáme Vám vedieť e-mailom.
        </p>

        ${renderSignature()}
      `,
    ),
  });
}

export async function sendOrderPaidEmail({
  orderCode,
  firstName,
  lastName,
  email,
  phone,
  totalPrice,
  calendarType,
  quantity,
  goodsPrice,
  discountCode,
  discountAmount,
  delivery,
  deliveryWaveKey,
  photoCount,
  birthdaysCount,
  namedaysCount,
  dedications,
  note,
}: SendOrderPaidEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const summary: OrderSummary = {
    orderCode,
    calendarType,
    quantity,
    totalPrice,
    goodsPrice,
    discountCode,
    discountAmount,
    delivery,
    deliveryWaveKey,
    photoCount,
    birthdaysCount,
    namedaysCount,
    dedications,
    note,
  };
  const customer: CustomerInfo = {
    firstName,
    lastName,
    email,
    phone,
  };

  await Promise.all([
    resend.emails.send({
      from: emailFrom,
      to: email,
      subject: `Platba prijatá — objednávka ${orderCode}`,
      html: renderEmailShell(
        "Platba bola prijatá",
        `
          <p>Dobrý deň, ${safeFirstName},</p>

          <p>
            ďakujeme — platbu k objednávke <strong>${escapeHtml(orderCode)}</strong> sme prijali.
            Vaše spomienky teraz pripravujeme: rozloženie fotiek, tlač a darčekové
            zabalenie so setom na zavesenie.
          </p>

          ${renderOrderCodeBlock(orderCode)}
          ${renderOrderSummaryHtml(summary)}

          <p>
            Objednávky spracúvame v spoločných várkach tlače. Keď bude kalendár
            hotový, dáme Vám vedieť e-mailom — pri Packete aj so sledovacím číslom,
            pri osobnom odbere s informáciou o prevzatí.
          </p>

          ${renderSignature()}
        `,
      ),
    }),

    resend.emails.send({
      from: emailFrom,
      to: adminEmail,
      subject: `Nová objednávka ${orderCode}`,
      html: renderEmailShell(
        `Nová objednávka ${escapeHtml(orderCode)}`,
        `
          <p>
            Objednávka <strong>${escapeHtml(orderCode)}</strong> bola úspešne zaplatená
            a je pripravená na spracovanie.
          </p>

          ${renderOrderCodeBlock(orderCode)}
          ${renderOrderSummaryHtml(summary)}
          ${renderCustomerHtml(customer)}

          <p>
            Objednávku nájdeš v admin paneli.
          </p>
        `,
      ),
    }),
  ]);
}

/** @deprecated Use sendOrderCreatedEmail */
export async function sendPendingPaymentEmail(
  params: SendOrderCreatedEmailParams,
) {
  return sendOrderCreatedEmail(params);
}

/** @deprecated Use sendOrderPaidEmail */
export async function sendPaidOrderEmail(params: SendOrderPaidEmailParams) {
  return sendOrderPaidEmail(params);
}

export async function sendOrderFulfillmentEmail({
  orderCode,
  firstName,
  email,
  delivery,
  trackingNumber,
}: SendOrderFulfillmentEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeTrackingNumber = trackingNumber ? escapeHtml(trackingNumber) : null;

  const isPacketa = delivery.method === "packeta";

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: isPacketa
      ? `Kalendár spomienok ${orderCode} je na ceste`
      : `Kalendár spomienok ${orderCode} je pripravený na odber`,
    html: renderEmailShell(
      isPacketa
        ? "Kalendár je na ceste"
        : "Kalendár je pripravený na odber",
      `
        <p>Dobrý deň, ${safeFirstName},</p>

        ${
          isPacketa
            ? `
              <p>
                Váš kalendár spomienok sme odoslali cez Packetu. Je darčekovo
                zabalený, obsahuje set na zavesenie a je pripravený robiť radosť.
              </p>
            `
            : `
              <p>
                Váš kalendár spomienok je pripravený na osobný odber v Košiciach.
                Je darčekovo zabalený a obsahuje set na zavesenie.
              </p>
              <p>
                Pre presný čas odberu Vás budeme kontaktovať, alebo sa môžete
                ozvať odpoveďou na tento e-mail.
              </p>
            `
        }

        ${renderOrderCodeBlock(orderCode)}
        ${renderDeliveryHtml(delivery)}

        ${
          isPacketa && safeTrackingNumber
            ? `
              <p style="margin-top: 20px;">
                Sledovacie číslo zásielky: <strong>${safeTrackingNumber}</strong>
              </p>
            `
            : isPacketa
              ? `
              <p style="margin-top: 20px; font-size: 14px; color: rgba(62, 15, 40, 0.72);">
                Informácie k zásielke Vám pošle aj Packeta, ak budú dostupné.
              </p>
            `
              : ""
        }

        ${renderSignature()}
      `,
    ),
  });
}

type SendBusinessInquiryEmailParams = {
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  quantity: number;
  message?: string | null;
};

export async function sendBusinessInquiryEmail(
  params: SendBusinessInquiryEmailParams,
) {
  const safeCompany = escapeHtml(params.company);
  const safeFirstName = escapeHtml(params.firstName);
  const safeLastName = escapeHtml(params.lastName);
  const safeEmail = escapeHtml(params.email);
  const safePhone = escapeHtml(params.phone);
  const safeQuantity = escapeHtml(String(params.quantity));
  const safeMessage = escapeHtml(params.message?.trim() || "—").replaceAll(
    "\n",
    "<br />",
  );

  await resend.emails.send({
    from: emailFrom,
    to: adminEmail,
    replyTo: params.email,
    subject: `Nezáväzná ponuka — ${params.company} (${params.quantity} ks)`,
    html: renderEmailShell(
      "Nezáväzná ponuka pre firmu",
      `
        <p>Prišiel nový dopyt na firemné kalendáre.</p>

        <div style="margin: 24px 0;">
          ${renderDetailRow("Firma", safeCompany)}
          ${renderDetailRow("Meno", `${safeFirstName} ${safeLastName}`)}
          ${renderDetailRow("E-mail", safeEmail)}
          ${renderDetailRow("Telefón", safePhone)}
          ${renderDetailRow("Počet kusov", safeQuantity)}
          ${renderDetailRow("Správa", safeMessage)}
        </div>
      `,
    ),
  });
}
