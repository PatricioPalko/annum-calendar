export type HealthCheckStatus = "ok" | "error" | "missing";

export type HealthChecks = {
  database: HealthCheckStatus;
  storage: HealthCheckStatus;
  resend: HealthCheckStatus;
};

const STORAGE_BUCKET = "calendar-uploads";

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
  );
}

export async function runHealthChecks(): Promise<HealthChecks> {
  const [database, storage, resend] = await Promise.all([
    checkDatabase(),
    checkStorage(),
    Promise.resolve(checkResendConfig()),
  ]);

  return {
    database,
    storage,
    resend,
  };
}

export function isOrderFlowHealthy(checks: HealthChecks) {
  return checks.database === "ok" && checks.storage === "ok";
}

async function checkDatabase(): Promise<HealthCheckStatus> {
  if (!hasSupabaseConfig()) {
    return "missing";
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase/admin");
    const { error } = await supabaseAdmin.from("orders").select("id").limit(1);

    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

async function checkStorage(): Promise<HealthCheckStatus> {
  if (!hasSupabaseConfig()) {
    return "missing";
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase/admin");
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list("", { limit: 1 });

    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

function checkResendConfig(): HealthCheckStatus {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return "missing";
  }

  return "ok";
}
