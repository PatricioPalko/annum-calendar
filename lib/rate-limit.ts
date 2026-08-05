import { supabaseAdmin } from "@/lib/supabase/admin";

type RateLimitState = {
  windowStartMs: number;
  count: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

const rateLimitStores = new Map<string, Map<string, RateLimitState>>();

/**
 * Prefer platform-provided client IP headers over spoofable leftmost XFF.
 * Vercel/proxies typically set x-real-ip to the connecting client.
 */
export function getClientIp(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.trim();

  if (vercelIp) {
    return vercelIp.split(",")[0]?.trim() || "unknown";
  }

  const xff = request.headers.get("x-forwarded-for");

  if (xff) {
    // Rightmost hop is usually added by the trusted proxy.
    const parts = xff
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length > 0) {
      return parts[parts.length - 1]!;
    }
  }

  return "unknown";
}

function pruneStore(store: Map<string, RateLimitState>, windowMs: number) {
  const now = Date.now();

  for (const [key, state] of store) {
    if (now - state.windowStartMs > windowMs) {
      store.delete(key);
    }
  }
}

function consumeRateLimitInMemory(
  namespace: string,
  key: string,
  options: { windowMs: number; max: number },
): RateLimitResult {
  let store = rateLimitStores.get(namespace);

  if (!store) {
    store = new Map<string, RateLimitState>();
    rateLimitStores.set(namespace, store);
  }

  // Opportunistic cleanup keeps the in-memory map from growing without bound.
  if (store.size > 500) {
    pruneStore(store, options.windowMs);
  }

  const now = Date.now();
  const state = store.get(key);

  if (!state || now - state.windowStartMs > options.windowMs) {
    store.set(key, {
      windowStartMs: now,
      count: 1,
    });

    return {
      ok: true,
      remaining: options.max - 1,
      retryAfterMs: 0,
    };
  }

  if (state.count >= options.max) {
    const retryAfterMs = options.windowMs - (now - state.windowStartMs);

    return {
      ok: false,
      remaining: 0,
      retryAfterMs,
    };
  }

  state.count += 1;

  return {
    ok: true,
    remaining: Math.max(0, options.max - state.count),
    retryAfterMs: 0,
  };
}

/**
 * Shared rate limit via Supabase RPC (works across serverless instances).
 * Falls back to in-memory when RPC is unavailable (e.g. before migration).
 */
export async function consumeRateLimit(
  namespace: string,
  key: string,
  options: { windowMs: number; max: number },
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
      p_scope: namespace,
      p_key: key,
      p_window_ms: options.windowMs,
      p_max: options.max,
    });

    if (!error && data && typeof data === "object" && data !== null) {
      const payload = data as {
        ok?: boolean;
        remaining?: number;
        retry_after_ms?: number;
      };

      return {
        ok: Boolean(payload.ok),
        remaining: Number(payload.remaining ?? 0),
        retryAfterMs: Number(payload.retry_after_ms ?? 0),
      };
    }

    console.error("RATE_LIMIT_RPC_ERROR:", error);
  } catch (rpcError) {
    console.error("RATE_LIMIT_RPC_EXCEPTION:", rpcError);
  }

  return consumeRateLimitInMemory(namespace, key, options);
}

export function rateLimitResponse(retryAfterMs: number) {
  return {
    message: "Príliš veľa pokusov. Skúste to prosím neskôr.",
    status: 429,
    headers: {
      "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
    },
  };
}
