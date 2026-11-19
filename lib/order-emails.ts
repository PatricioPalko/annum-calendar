import {
  formatWaveDeliveryBy,
  getDeliveryWaveByKey,
} from "@/lib/order/delivery-waves";
import {
  getPaymentMethodLabel,
  type PaymentMethod,
} from "@/helpers/payment-method";
import { MEMORY_SET_LABEL } from "@/lib/order/config";
import { OPERATOR } from "@/lib/legal";
import { getResend } from "@/lib/resend";
import { SITE_URL } from "@/lib/seo";
import type { Resend } from "resend";

const emailFrom = process.env.EMAIL_FROM!;

export function getAdminEmailRecipients() {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

type CalendarType = "basic" | "premium" | "memory" | "business";

/** Personal pickup is the only delivery method. */
const PICKUP_LABEL = "Osobný odber v Košiciach";

type OrderSummary = {
  orderCode: string;
  calendarType: CalendarType;
  quantity: number;
  totalPrice: number | null;
  goodsPrice?: number | null;
  discountCode?: string | null;
  discountAmount?: number | null;
  deliveryWaveKey?: string | null;
  paymentMethod: PaymentMethod;
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

type SendOrderReceivedEmailsParams = CustomerInfo &
  OrderSummary & {
    /** Variable symbol for bank transfers. */
    orderNumber?: number | null;
  };

type SendOrderFulfillmentEmailParams = {
  orderCode: string;
  firstName: string;
  email: string;
};

type SendEmailPayload = Parameters<Resend["emails"]["send"]>[0];

async function sendEmail(
  options: SendEmailPayload,
  requestOptions?: { idempotencyKey?: string },
) {
  if (!emailFrom) {
    throw new Error("Missing EMAIL_FROM");
  }

  const { error } = await getResend().emails.send(options, requestOptions);

  if (error) {
    throw new Error(`Resend: ${error.name} — ${error.message}`);
  }
}

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

function renderDeliveryWaveHtml(deliveryWaveKey?: string | null) {
  const wave = getDeliveryWaveByKey(deliveryWaveKey);

  if (!wave) {
    return "";
  }

  return `
    ${renderDetailRow("Výrobná várka", escapeHtml(wave.customerHeadline))}
    ${renderDetailRow("Na odber do", escapeHtml(formatWaveDeliveryBy(wave)))}
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
              `${escapeHtml(summary.discountCode!)} -${formatPrice(summary.discountAmount!)}`,
            )
          : ""
      }
      ${renderDetailRow("Odber", escapeHtml(PICKUP_LABEL))}
      ${renderDetailRow(
        "Spôsob platby",
        escapeHtml(getPaymentMethodLabel(summary.paymentMethod)),
      )}
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

function renderPaymentInstructionsHtml({
  paymentMethod,
  totalPrice,
  orderCode,
  orderNumber,
}: {
  paymentMethod: PaymentMethod;
  totalPrice: number | null;
  orderCode: string;
  orderNumber?: number | null;
}) {
  const amount =
    totalPrice !== null ? formatPrice(totalPrice) : "dohodnutú sumu";

  if (paymentMethod === "cash") {
    return `
      <div style="margin: 24px 0; padding: 16px; background: #FFF7F4; border: 1px solid #EAD6DE; border-radius: 12px;">
        <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #FC5A61; font-weight: 700;">
          Platba
        </p>
        <p style="margin: 0;">
          Sumu <strong>${escapeHtml(amount)}</strong> zaplatíte v hotovosti pri osobnom odbere.
        </p>
      </div>
    `;
  }

  const iban = process.env.BANK_ACCOUNT_IBAN?.trim();

  if (!iban) {
    console.error("BANK_ACCOUNT_CONFIG_ERROR:", { missing: "BANK_ACCOUNT_IBAN" });
  }

  return `
    <div style="margin: 24px 0; padding: 16px; background: #FFF7F4; border: 1px solid #EAD6DE; border-radius: 12px;">
      <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #FC5A61; font-weight: 700;">
        Platba prevodom na účet
      </p>
      ${renderDetailRow("Suma", escapeHtml(amount))}
      ${
        iban
          ? renderDetailRow("IBAN", escapeHtml(iban))
          : renderDetailRow("IBAN", "Číslo účtu Vám pošleme v samostatnom e-maile.")
      }
      ${
        orderNumber
          ? renderDetailRow("Variabilný symbol", escapeHtml(String(orderNumber)))
          : ""
      }
      ${renderDetailRow("Správa pre prijímateľa", escapeHtml(orderCode))}
      <p style="margin: 12px 0 0; font-size: 14px; color: rgba(62, 15, 40, 0.72);">
        Prosíme o úhradu pred odberom kalendára.
      </p>
    </div>
  `;
}

function renderSignature() {
  const logoUrl = `${SITE_URL}/icon-512.png`;
  const termsUrl = `${SITE_URL}/obchodne-podmienky`;
  const safeWeb = escapeHtml(SITE_URL.replace(/^https:\/\//, ""));
  const safeEmail = escapeHtml(OPERATOR.email);
  const safeOperator = escapeHtml(
    `${OPERATOR.name} · IČO ${OPERATOR.ico} · Košice`,
  );

  return `
    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #EAD6DE;">
      <p style="margin: 0 0 16px;">Ďakujeme,</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <a href="${SITE_URL}" style="text-decoration: none;">
              <img src="${logoUrl}" width="48" height="48" alt="Annum" style="display: block; width: 48px; height: 48px; border: 0;" />
            </a>
          </td>
          <td style="vertical-align: middle;">
            <p style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #3E0F28;">
              Annum<span style="color: #FC5A61;">.</span>
            </p>
            <p style="margin: 2px 0 0; font-size: 13px; color: rgba(62, 15, 40, 0.65);">
              Fotokalendáre z vašich fotiek
            </p>
          </td>
        </tr>
      </table>
      <p style="margin: 14px 0 0; font-size: 14px;">
        <a href="${SITE_URL}" style="color: #3E0F28; font-weight: 700; text-decoration: none;">${safeWeb}</a><br />
        <a href="mailto:${safeEmail}" style="color: #3E0F28; font-weight: 700; text-decoration: none;">${safeEmail}</a>
      </p>
      <p style="margin: 14px 0 0; font-size: 12px; color: rgba(62, 15, 40, 0.45);">
        ${safeOperator}
      </p>
      <p style="margin: 6px 0 0; font-size: 12px;">
        <a href="${termsUrl}" style="color: rgba(62, 15, 40, 0.55); text-decoration: underline;">Obchodné podmienky</a>
      </p>
    </div>
  `;
}

export type SendOrderReceivedEmailsOptions = {
  /** Which of the two emails to send. Defaults to both. */
  customer?: boolean;
  admin?: boolean;
  /**
   * Prefix for Resend idempotency keys (deduplicated by Resend for 24 h).
   * Omit for intentional manual resends.
   */
  idempotencyKeyPrefix?: string;
};

export type OrderReceivedEmailsResult = {
  customerSent: boolean;
  adminSent: boolean;
  customerError?: unknown;
  adminError?: unknown;
};

/**
 * Customer confirmation with payment instructions and the admin notification
 * for a new order. The site never confirms payments; the operator checks
 * bank transfers and cash outside the site.
 */
export async function sendOrderReceivedEmails(
  {
    orderCode,
    orderNumber,
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
    deliveryWaveKey,
    paymentMethod,
    photoCount,
    birthdaysCount,
    namedaysCount,
    dedications,
    note,
  }: SendOrderReceivedEmailsParams,
  options: SendOrderReceivedEmailsOptions = {},
): Promise<OrderReceivedEmailsResult> {
  const sendToCustomer = options.customer ?? true;
  const sendToAdmin = options.admin ?? true;
  const idempotencyKey = (recipient: "customer" | "admin") =>
    options.idempotencyKeyPrefix
      ? { idempotencyKey: `${options.idempotencyKeyPrefix}/${recipient}` }
      : undefined;

  const safeFirstName = escapeHtml(firstName);
  const summary: OrderSummary = {
    orderCode,
    calendarType,
    quantity,
    totalPrice,
    goodsPrice,
    discountCode,
    discountAmount,
    deliveryWaveKey,
    paymentMethod,
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

  const sendCustomerEmail = () =>
    sendEmail({
      from: emailFrom,
      to: email,
      subject: `Objednávka ${orderCode} bola prijatá`,
      html: renderEmailShell(
        "Objednávka bola prijatá",
        `
          <p>Dobrý deň, ${safeFirstName},</p>

          <p>
            ďakujeme za objednávku kalendára spomienok. Objednávku sme prijali
            a zaradíme ju do výrobnej várky: rozloženie fotiek, tlač a darčekové
            zabalenie.
          </p>

          ${renderOrderCodeBlock(orderCode)}
          ${renderPaymentInstructionsHtml({
            paymentMethod,
            totalPrice,
            orderCode,
            orderNumber,
          })}
          ${renderOrderSummaryHtml(summary)}

          <p>
            Keď bude kalendár pripravený na osobný odber v Košiciach, dáme Vám
            vedieť e-mailom a dohodneme sa na čase odberu.
          </p>

          <p>
            Ak v súhrne niečo nesedí, odpovedzte prosím na tento e-mail.
          </p>

          ${renderSignature()}
        `,
      ),
    }, idempotencyKey("customer"));

  const sendAdminEmail = () => {
    const adminRecipients = getAdminEmailRecipients();

    if (adminRecipients.length === 0) {
      throw new Error("Missing ADMIN_EMAIL");
    }

    const title = `Nová objednávka ${orderCode}`;

    return sendEmail({
      from: emailFrom,
      to: adminRecipients,
      replyTo: email,
      subject: title,
      html: renderEmailShell(
        escapeHtml(title),
        `
          <p>
            Prišla nová objednávka <strong>${escapeHtml(orderCode)}</strong>.
            Platba: ${escapeHtml(getPaymentMethodLabel(paymentMethod).toLowerCase())}
            (web ju neoveruje).
          </p>

          ${renderOrderCodeBlock(orderCode)}
          ${renderOrderSummaryHtml(summary)}
          ${renderCustomerHtml(customer)}

          <p style="margin: 24px 0;">
            <a href="${escapeHtml(`${SITE_URL}/admin`)}" style="display: inline-block; background: #3E0F28; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 700;">
              Otvoriť v admin paneli
            </a>
          </p>
        `,
      ),
    }, idempotencyKey("admin"));
  };

  // Independent sends: one failing must not hide whether the other went out.
  const [customerResult, adminResult] = await Promise.allSettled([
    sendToCustomer ? sendCustomerEmail() : Promise.resolve(),
    sendToAdmin ? sendAdminEmail() : Promise.resolve(),
  ]);

  return {
    customerSent: sendToCustomer && customerResult.status === "fulfilled",
    adminSent: sendToAdmin && adminResult.status === "fulfilled",
    customerError:
      customerResult.status === "rejected" ? customerResult.reason : undefined,
    adminError: adminResult.status === "rejected" ? adminResult.reason : undefined,
  };
}

type SendAdminAlertEmailParams = {
  /** Log code, e.g. SERVER_ERROR. */
  code: string;
  /** Short operator-facing explanation in Slovak. No customer personal data. */
  summary: string;
  orderId?: string | null;
  /** Extra label/value rows (no customer data). */
  details?: Array<[label: string, value: string]>;
  /** Overrides the default dedupe id (the order id). */
  dedupeId?: string;
  title?: string;
  footer?: string;
};

/**
 * Operator alert for failed order emails and server errors. Contains ids only
 * (no customer data) and is deduplicated by Resend for 24 h per code and
 * dedupe id.
 */
export async function sendAdminAlertEmail({
  code,
  summary,
  orderId,
  details = [],
  dedupeId,
  title = "Upozornenie",
  footer = "Skontrolujte objednávku v admin paneli.",
}: SendAdminAlertEmailParams) {
  const adminRecipients = getAdminEmailRecipients();

  if (adminRecipients.length === 0) {
    throw new Error("Missing ADMIN_EMAIL");
  }

  const resolvedDedupeId = dedupeId ?? orderId ?? "none";

  await sendEmail(
    {
      from: emailFrom,
      to: adminRecipients,
      subject: `Upozornenie: ${code}`,
      html: renderEmailShell(
        escapeHtml(title),
        `
          <p>${escapeHtml(summary)}</p>

          <div style="margin: 24px 0;">
            ${renderDetailRow("Kód", escapeHtml(code))}
            ${orderId ? renderDetailRow("ID objednávky", escapeHtml(orderId)) : ""}
            ${details.map(([label, value]) => renderDetailRow(label, escapeHtml(value))).join("")}
          </div>

          <p style="font-size: 13px; color: rgba(62, 15, 40, 0.65);">
            ${escapeHtml(footer)}
          </p>
        `,
      ),
    },
    { idempotencyKey: `alert/${code}/${resolvedDedupeId}` },
  );
}

export async function sendOrderFulfillmentEmail({
  orderCode,
  firstName,
  email,
}: SendOrderFulfillmentEmailParams) {
  const safeFirstName = escapeHtml(firstName);

  await sendEmail({
    from: emailFrom,
    to: email,
    subject: `Kalendár spomienok ${orderCode} je pripravený na odber`,
    html: renderEmailShell(
      "Kalendár je pripravený na odber",
      `
        <p>Dobrý deň, ${safeFirstName},</p>

        <p>
          Váš kalendár spomienok je pripravený na osobný odber v Košiciach.
          Je darčekovo zabalený.
        </p>
        <p>
          Pre presný čas odberu Vás budeme kontaktovať, alebo sa môžete
          ozvať odpoveďou na tento e-mail.
        </p>

        ${renderOrderCodeBlock(orderCode)}
        ${renderDetailRow("Odber", escapeHtml(PICKUP_LABEL))}

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

  await sendEmail({
    from: emailFrom,
    to: getAdminEmailRecipients(),
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
