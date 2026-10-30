import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  DELIVERY_WAVES,
  getDeliveryWaveByKey,
  getDeliveryWaveForDate,
  getUpcomingDeliveryWaves,
} from "@/lib/order/delivery-waves";

function waveAt(isoUtc: string) {
  return getDeliveryWaveForDate(new Date(isoUtc)).key;
}

// Deadlines are whole days in Europe/Bratislava (CET = UTC+1 from 25 Oct 2026).
describe("getDeliveryWaveForDate (H-6)", () => {
  it.each([
    ["2026-10-01T10:00:00Z", "batch-2026-october"],
    ["2026-10-31T22:59:59Z", "batch-2026-october"], // 23:59:59 on 31 Oct in Bratislava
    ["2026-10-31T23:00:00Z", "batch-2026-november"], // 00:00 on 1 Nov in Bratislava
    ["2026-11-30T22:59:59Z", "batch-2026-november"],
    ["2026-11-30T23:00:00Z", "batch-2026-december"],
    ["2026-12-13T22:59:59Z", "batch-2026-december"],
    ["2026-12-13T23:00:00Z", "batch-2027-january"],
    ["2027-01-10T22:59:59Z", "batch-2027-january"],
    ["2027-01-10T23:00:00Z", "standard"],
  ])("%s belongs to %s", (isoUtc, expected) => {
    expect(waveAt(isoUtc)).toBe(expected);
  });

  it("uses the shop's timezone, not UTC, on the evening of a deadline", () => {
    // Still 31 Oct in UTC, but already 1 Nov in Bratislava.
    expect(new Date("2026-10-31T23:30:00Z").getUTCDate()).toBe(31);
    expect(waveAt("2026-10-31T23:30:00Z")).toBe("batch-2026-november");
  });

  it("lists only waves whose deadline has not passed", () => {
    expect(getUpcomingDeliveryWaves(new Date("2026-11-15T12:00:00Z")).map((wave) => wave.key)).toEqual([
      "batch-2026-november",
      "batch-2026-december",
      "batch-2027-january",
    ]);
    expect(getUpcomingDeliveryWaves(new Date("2027-02-01T12:00:00Z"))).toEqual([]);
  });

  it("resolves stored keys, including unknown ones", () => {
    for (const wave of DELIVERY_WAVES) {
      expect(getDeliveryWaveByKey(wave.key)).toBe(wave);
    }

    expect(getDeliveryWaveByKey("standard")?.key).toBe("standard");
    expect(getDeliveryWaveByKey("batch-2025-old")).toBeNull();
    expect(getDeliveryWaveByKey(null)).toBeNull();
  });
});

describe("pages that show the current wave are not frozen at build time (N-1)", () => {
  it.each(["app/page.tsx", "app/objednavka/page.tsx"])("%s exports a revalidate interval", (file) => {
    const source = readFileSync(fileURLToPath(new URL(`../../${file}`, import.meta.url)), "utf8");

    expect(source).toMatch(/^export const revalidate = \d+;$/m);
  });
});
