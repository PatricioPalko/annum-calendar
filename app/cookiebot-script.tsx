import Script from "next/script";

const cookiebotId = process.env.NEXT_PUBLIC_COOKIEBOT_ID?.trim();
const isProduction = process.env.NODE_ENV === "production";

export function CookiebotScript() {
  if (!cookiebotId || !isProduction) {
    return null;
  }

  // Auto-blocking requires an early head script (not lazy/deferred).
  return (
    <Script
      id="Cookiebot"
      src="https://consent.cookiebot.com/uc.js"
      strategy="beforeInteractive"
      data-cbid={cookiebotId}
      data-blockingmode="auto"
      data-culture="SK"
    />
  );
}
