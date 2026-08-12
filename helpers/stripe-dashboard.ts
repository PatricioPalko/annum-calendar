type StripeOrderRefs = {
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
};

function getStripeDashboardPrefix() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (secretKey?.startsWith("sk_test_")) {
    return "/test";
  }

  return "";
}

export function getStripePaymentDashboardUrl(
  order: StripeOrderRefs,
): string | null {
  const prefix = getStripeDashboardPrefix();

  if (order.stripe_payment_intent_id) {
    return `https://dashboard.stripe.com${prefix}/payments/${order.stripe_payment_intent_id}`;
  }

  if (order.stripe_checkout_session_id) {
    return `https://dashboard.stripe.com${prefix}/checkout/sessions/${order.stripe_checkout_session_id}`;
  }

  return null;
}
