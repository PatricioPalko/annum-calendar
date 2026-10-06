const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

type EventParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function getGaMeasurementId() {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

  if (!MEASUREMENT_ID_PATTERN.test(value)) {
    return null;
  }

  return value;
}

// Same condition as CookiebotScript: the banner is production-only.
export function isAnalyticsConsentRequired() {
  const cookiebotId = process.env.NEXT_PUBLIC_COOKIEBOT_ID?.trim();

  return Boolean(cookiebotId) && process.env.NODE_ENV === "production";
}

function canTrack() {
  const measurementId = getGaMeasurementId();

  if (
    !measurementId ||
    typeof window === "undefined" ||
    typeof window.gtag !== "function"
  ) {
    return false;
  }

  if (!isAnalyticsConsentRequired()) {
    return true;
  }

  return window.Cookiebot?.consent?.statistics === true;
}

export function pageview(pagePath: string) {
  if (!canTrack()) {
    return;
  }

  window.gtag?.("event", "page_view", {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: EventParams) {
  if (!canTrack()) {
    return;
  }

  window.gtag?.("event", name, params);
}
