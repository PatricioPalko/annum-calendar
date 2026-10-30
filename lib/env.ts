import { SITE_URL } from "@/lib/seo";

/**
 * Server env vars the order and payment flow cannot work without.
 * Names only: values are never read into logs or the UI.
 */
const REQUIRED_SERVER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ORDER_PAYMENT_SIGNING_SECRET",
  "UPLOAD_SIGNING_SECRET",
  "TURNSTILE_SECRET_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "NEXT_PUBLIC_PACKETA_API_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "ADMIN_EMAIL",
  "ADMIN_EMAILS",
] as const;

/**
 * Ordering works without these: Packeta labels need the first two, the
 * scheduled paid-email retry (`/api/cron/retry-paid-emails`) needs CRON_SECRET.
 */
const RECOMMENDED_SERVER_ENV = [
  "PACKETA_API_PASSWORD",
  "PACKETA_ESHOP",
  "CRON_SECRET",
] as const;

export type EnvProblems = {
  missingRequired: string[];
  missingRecommended: string[];
  /** Human-readable configuration warnings (no values). */
  warnings: string[];
};

function isMissing(name: string) {
  return !process.env[name]?.trim();
}

export function getEnvProblems(): EnvProblems {
  const missingRequired = REQUIRED_SERVER_ENV.filter(isMissing);
  const missingRecommended = RECOMMENDED_SERVER_ENV.filter(isMissing);
  const warnings: string[] = [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (appUrl) {
    try {
      const appOrigin = new URL(appUrl);
      const siteOrigin = new URL(SITE_URL);
      const siteDomain = siteOrigin.hostname.replace(/^www\./, "");

      // Admin mutations check Origin against NEXT_PUBLIC_APP_URL, while
      // next.config.ts redirects the apex domain to SITE_URL. A production URL
      // on the shop's domain that differs from SITE_URL (apex vs www, http vs
      // https) makes every admin action 403. Local and preview URLs are fine.
      if (
        appOrigin.hostname.replace(/^www\./, "") === siteDomain &&
        appOrigin.origin !== siteOrigin.origin
      ) {
        warnings.push(
          `NEXT_PUBLIC_APP_URL must be exactly ${SITE_URL}; otherwise admin actions return 403.`,
        );
      }
    } catch {
      warnings.push("NEXT_PUBLIC_APP_URL is not a valid URL.");
    }
  }

  return { missingRequired, missingRecommended, warnings };
}

export function hasEnvProblems(problems: EnvProblems) {
  return (
    problems.missingRequired.length > 0 ||
    problems.missingRecommended.length > 0 ||
    problems.warnings.length > 0
  );
}

/** Called once at server start from instrumentation.ts. */
export function logEnvProblems() {
  const problems = getEnvProblems();

  if (problems.missingRequired.length > 0 || problems.warnings.length > 0) {
    console.error("ENV_CONFIG_ERROR:", {
      missingRequired: problems.missingRequired,
      warnings: problems.warnings,
    });
  }

  if (problems.missingRecommended.length > 0) {
    console.warn("ENV_CONFIG_WARNING:", {
      missingRecommended: problems.missingRecommended,
    });
  }
}
