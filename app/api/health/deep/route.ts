import { NextResponse } from "next/server";

import {
  isOrderFlowHealthy,
  runHealthChecks,
} from "@/lib/health-checks";

export const runtime = "nodejs";

export async function GET() {
  const checks = await runHealthChecks();
  const ok = isOrderFlowHealthy(checks);

  return NextResponse.json(
    {
      ok,
      service: "annum-calendar",
      checkedAt: new Date().toISOString(),
      checks,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
