import { resend } from "@/lib/resend";

const emailFrom = process.env.EMAIL_FROM!;
const adminEmail = process.env.ADMIN_EMAIL!;

type DeliveryMethod = "pickup" | "packeta";

type DeliveryInfo = {
  method: DeliveryMethod;
  price: number;
  packetaPoint?: {
    id: string;
    name: string;
    address: string;
  } | null;
};

type SendPendingPaymentEmailParams = {
  orderCode: string;
  firstName: string;
  lastName: string;
  email: string;
  totalPrice: number;
  paymentUrl: string;
  delivery: DeliveryInfo;
};

type SendPaidOrderEmailParams = {
  orderCode: string;
  firstName: string;
  lastName: string;
  email: string;
  totalPrice: number | null;
  delivery: DeliveryInfo;
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

function getDeliveryLabel(method: DeliveryMethod) {
  switch (method) {
    case "packeta":
      return "Packeta";
    case "pickup":
    default:
      return "Osobný odber";
  }
}

function renderDeliveryHtml(delivery: DeliveryInfo) {
  const safeDeliveryLabel = escapeHtml(getDeliveryLabel(delivery.method));
  const deliveryPrice =
    delivery.price > 0 ? ` · ${formatPrice(delivery.price)}` : "";

  if (delivery.method === "packeta" && delivery.packetaPoint) {
    return `
      <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
        <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
          Doručenie
        </p>

        <p style="margin: 2px 0 0; font-weight: 700;">
          ${safeDeliveryLabel}${deliveryPrice}
        </p>

        <p style="margin: 6px 0 0; font-size: 13px; color: rgba(62, 15, 40, 0.72);">
          ${escapeHtml(delivery.packetaPoint.name)}<br />
          ${escapeHtml(delivery.packetaPoint.address)}
        </p>

        <p style="margin: 4px 0 0; font-size: 12px; color: rgba(62, 15, 40, 0.45);">
          ID výdajného miesta: ${escapeHtml(delivery.packetaPoint.id)}
        </p>
      </div>
    `;
  }

  return `
    <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
      <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
        Doručenie
      </p>

      <p style="margin: 2px 0 0; font-weight: 700;">
        ${safeDeliveryLabel}${deliveryPrice}
      </p>
    </div>
  `;
}

export async function sendPendingPaymentEmail({
  orderCode,
  firstName,
  lastName,
  email,
  totalPrice,
  paymentUrl,
  delivery,
}: SendPendingPaymentEmailParams) {
  const safeOrderCode = escapeHtml(orderCode);
  const safeFirstName = escapeHtml(firstName);
  const safeLastName = escapeHtml(lastName);
  const safeEmail = escapeHtml(email);
  const safePaymentUrl = escapeHtml(paymentUrl);

  await Promise.all([
    resend.emails.send({
      from: emailFrom,
      to: email,
      subject: `Objednávka ${orderCode} čaká na platbu`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #3E0F28; line-height: 1.6; max-width: 560px; margin: 0 auto;">
          <h1 style="margin: 0 0 16px;">
            Objednávka je uložená
          </h1>

          <p>Dobrý deň, ${safeFirstName},</p>

          <p>
            Vašu objednávku sme uložili. Na spracovanie ju zaradíme po úspešnej platbe.
          </p>

          <div style="margin: 24px 0; padding: 16px; background: #FFF7F4; border: 1px solid #EAD6DE; border-radius: 12px;">
            <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #FC5A61; font-weight: 700;">
              Číslo objednávky
            </p>
            <p style="margin: 4px 0 0; font-size: 22px; font-weight: 800;">
              ${safeOrderCode}
            </p>
          </div>

          <div style="margin: 24px 0;">
            <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
              <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
                Suma na úhradu
              </p>
              <p style="margin: 2px 0 0; font-weight: 700;">
                ${formatPrice(totalPrice)}
              </p>
            </div>

            ${renderDeliveryHtml(delivery)}
          </div>

          <p>
            Ak ste platbu nedokončili, môžete ju dokončiť cez tento odkaz:
          </p>

          <p style="margin: 24px 0;">
            <a href="${safePaymentUrl}" style="display: inline-block; background: #3E0F28; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 700;">
              Dokončiť platbu
            </a>
          </p>

          <p style="font-size: 13px; color: rgba(62, 15, 40, 0.65);">
            Ak tlačidlo nefunguje, skopírujte tento odkaz do prehliadača:<br />
            ${safePaymentUrl}
          </p>

          <p style="margin-top: 24px;">
            Annum
          </p>
        </div>
      `,
    }),

    resend.emails.send({
      from: emailFrom,
      to: adminEmail,
      subject: `Nová objednávka čaká na platbu: ${orderCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #3E0F28; line-height: 1.6; max-width: 560px; margin: 0 auto;">
          <h1 style="margin: 0 0 16px;">
            Nová objednávka čaká na platbu
          </h1>

          <p>
            Objednávka <strong>${safeOrderCode}</strong> bola vytvorená, ale platba zatiaľ nebola potvrdená.
          </p>

          <div style="margin: 24px 0; padding: 16px; background: #FFF7F4; border: 1px solid #EAD6DE; border-radius: 12px;">
            <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
              Zákazník
            </p>
            <p style="margin: 4px 0 0; font-weight: 700;">
              ${safeFirstName} ${safeLastName}
            </p>

            <p style="margin: 12px 0 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
              E-mail
            </p>
            <p style="margin: 4px 0 0; font-weight: 700;">
              ${safeEmail}
            </p>

            <p style="margin: 12px 0 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
              Suma
            </p>
            <p style="margin: 4px 0 0; font-weight: 700;">
              ${formatPrice(totalPrice)}
            </p>

            <p style="margin: 12px 0 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
              Doručenie
            </p>
            <p style="margin: 4px 0 0; font-weight: 700;">
              ${escapeHtml(getDeliveryLabel(delivery.method))}
              ${delivery.price > 0 ? ` · ${formatPrice(delivery.price)}` : ""}
            </p>

            ${
              delivery.method === "packeta" && delivery.packetaPoint
                ? `
                  <p style="margin: 4px 0 0; font-size: 13px; color: rgba(62, 15, 40, 0.72);">
                    ${escapeHtml(delivery.packetaPoint.name)}<br />
                    ${escapeHtml(delivery.packetaPoint.address)}
                  </p>

                  <p style="margin: 4px 0 0; font-size: 12px; color: rgba(62, 15, 40, 0.45);">
                    ID výdajného miesta: ${escapeHtml(delivery.packetaPoint.id)}
                  </p>
                `
                : ""
            }
          </div>

          <p>
            Objednávku nájdeš v admin paneli ako čakajúcu na platbu.
          </p>
        </div>
      `,
    }),
  ]);
}

export async function sendPaidOrderEmail({
  orderCode,
  firstName,
  email,
  totalPrice,
  delivery,
}: SendPaidOrderEmailParams) {
  const safeOrderCode = escapeHtml(orderCode);
  const safeFirstName = escapeHtml(firstName);

  await Promise.all([
    resend.emails.send({
      from: emailFrom,
      to: email,
      subject: `Platba k objednávke ${orderCode} bola prijatá`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #3E0F28; line-height: 1.6; max-width: 560px; margin: 0 auto;">
          <h1 style="margin: 0 0 16px;">
            Platba bola prijatá
          </h1>

          <p>Dobrý deň, ${safeFirstName},</p>

          <p>
            ďakujeme, platbu k objednávke <strong>${safeOrderCode}</strong> sme prijali.
            Začíname pripravovať váš kalendár.
          </p>

          <div style="margin: 24px 0;">
            ${
              totalPrice !== null
                ? `
                  <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
                    <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
                      Uhradená suma
                    </p>
                    <p style="margin: 2px 0 0; font-weight: 700;">
                      ${formatPrice(totalPrice)}
                    </p>
                  </div>
                `
                : ""
            }

            ${renderDeliveryHtml(delivery)}
          </div>

          <p>
            Keď bude kalendár pripravený, budeme vás kontaktovať.
          </p>

          <p style="margin-top: 24px;">
            Annum
          </p>
        </div>
      `,
    }),

    resend.emails.send({
      from: emailFrom,
      to: adminEmail,
      subject: `Objednávka zaplatená: ${orderCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #3E0F28; line-height: 1.6; max-width: 560px; margin: 0 auto;">
          <h1 style="margin: 0 0 16px;">
            Objednávka zaplatená
          </h1>

          <p>
            Objednávka <strong>${safeOrderCode}</strong> bola zaplatená.
          </p>

          <div style="margin: 24px 0;">
            ${
              totalPrice !== null
                ? `
                  <div style="padding: 10px 0; border-bottom: 1px solid #EAD6DE;">
                    <p style="margin: 0; font-size: 13px; color: rgba(62, 15, 40, 0.6);">
                      Suma
                    </p>
                    <p style="margin: 2px 0 0; font-weight: 700;">
                      ${formatPrice(totalPrice)}
                    </p>
                  </div>
                `
                : ""
            }

            ${renderDeliveryHtml(delivery)}
          </div>

          <p>
            Objednávku môžeš spracovať v admin paneli.
          </p>
        </div>
      `,
    }),
  ]);
}
