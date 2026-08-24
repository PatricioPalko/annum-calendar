import { sendBusinessInquiryEmail } from "@/lib/order-emails";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { businessInquirySchema } from "@/lib/business-inquiry-schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await consumeRateLimit("business-inquiry", ip, {
    windowMs: 10 * 60 * 1000,
    max: 5,
  });

  if (!rate.ok) {
    const limited = rateLimitResponse(rate.retryAfterMs);

    return NextResponse.json(
      { message: limited.message },
      { status: limited.status, headers: limited.headers },
    );
  }

  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL || !process.env.EMAIL_FROM) {
    console.error("BUSINESS_INQUIRY_CONFIG_ERROR: missing email configuration");

    return NextResponse.json(
      { message: "Server nie je správne nakonfigurovaný." },
      { status: 500 },
    );
  }

  const body = await request.json();
  const parsed = businessInquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Neplatné údaje vo formulári.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    await sendBusinessInquiryEmail(parsed.data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("BUSINESS_INQUIRY_EMAIL_ERROR:", error);

    return NextResponse.json(
      { message: "Nepodarilo sa odoslať dopyt. Skúste to prosím znova." },
      { status: 500 },
    );
  }
}
