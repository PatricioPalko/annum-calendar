import { afterEach, describe, expect, it, vi } from "vitest";

import { getEnvProblems, hasEnvProblems } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

function missingRecommendedNames() {
  return getEnvProblems().missingRecommended.map(({ name }) => name);
}

describe("getEnvProblems", () => {
  it("reports a missing BANK_ACCOUNT_IBAN in every environment", () => {
    vi.stubEnv("BANK_ACCOUNT_IBAN", "");
    vi.stubEnv("NODE_ENV", "development");

    expect(missingRecommendedNames()).toContain("BANK_ACCOUNT_IBAN");
  });

  it("reports a missing CRON_SECRET only in production", () => {
    vi.stubEnv("CRON_SECRET", "");

    vi.stubEnv("NODE_ENV", "development");
    expect(missingRecommendedNames()).not.toContain("CRON_SECRET");

    vi.stubEnv("NODE_ENV", "production");
    expect(missingRecommendedNames()).toContain("CRON_SECRET");
  });

  it("does not treat missing recommended vars as a configuration error", () => {
    vi.stubEnv("BANK_ACCOUNT_IBAN", "");
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");

    const problems = getEnvProblems();

    expect(problems.missingRecommended.length).toBeGreaterThan(0);
    expect(problems.missingRequired).toEqual(expect.any(Array));
    expect(hasEnvProblems({ ...problems, missingRequired: [], warnings: [] })).toBe(false);
  });

  it("no longer asks for Stripe or Packeta keys", () => {
    const names = [
      ...getEnvProblems().missingRequired,
      ...missingRecommendedNames(),
    ];

    expect(names.filter((name) => /STRIPE|PACKETA|ORDER_PAYMENT/.test(name))).toEqual([]);
  });
});
