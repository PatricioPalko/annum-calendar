import { Resend } from "resend";

let resendClient: Resend | null = null;

/**
 * Created on first use: the Resend constructor throws without RESEND_API_KEY,
 * and this module is imported by the order and payment routes. A missing key
 * must only break email sending, not order creation or payment marking.
 */
export function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}
