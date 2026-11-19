import { SITE_URL } from "@/lib/seo";

/**
 * Server env vars the order flow cannot work without.
 * Names only: values are never read into logs or the UI.
 */
const REQUIRED_SERVER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
  "UPLOAD_SIGNING_SECRET",
  "TURNSTILE_SECRET_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "ADMIN_EMAIL",
  "ADMIN_EMAILS",
] as const;

/**
 * Ordering works without these. Each entry says what is missing without it
 * (shown in /admin). `productionOnly` vars are not reported in development.
 */
const RECOMMENDED_SERVER_ENV = [
  {
    name: "BANK_ACCOUNT_IBAN",
    purpose:
      "číslo účtu v e-maile pri platbe prevodom (bez neho zákazník dostane správu, že číslo účtu mu pošlete samostatne)",
    productionOnly: false,
  },
  {
    // Used only by the scheduled email retry: GitHub Actions calls
    // `/api/cron/retry-paid-emails` on the production site.
    name: "CRON_SECRET",
    purpose:
      "automatické opakovanie neodoslaných e-mailov (rovnakú hodnotu treba aj v GitHub repo secrets)",
    productionOnly: true,
  },
] as const;

export type MissingRecommendedEnv = { name: string; purpose: string };

export type EnvProblems = {
  missingRequired: string[];
  missingRecommended: MissingRecommendedEnv[];
  /** Human-readable configuration warnings (no values). */
  warnings: string[];
};

function isMissing(name: string) {
  return !process.env[name]?.trim();
}

export function getEnvProblems(): EnvProblems {
  const missingRequired = REQUIRED_SERVER_ENV.filter(isMissing);
  const isProduction = process.env.NODE_ENV === "production";
  const missingRecommended = RECOMMENDED_SERVER_ENV.filter(
    (entry) => (isProduction || !entry.productionOnly) && isMissing(entry.name),
  ).map(({ name, purpose }) => ({ name, purpose }));
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

/** Problems that can break orders or admin actions (red banner in /admin). */
export function hasEnvProblems(problems: EnvProblems) {
  return problems.missingRequired.length > 0 || problems.warnings.length > 0;
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
      missingRecommended: problems.missingRecommended.map(({ name }) => name),
    });
  }
}
