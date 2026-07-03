type RateLimitState = {
  windowStartMs: number;
  count: number;
};

const rateLimitStores = new Map<string, Map<string, RateLimitState>>();

export function getClientIp(request: Request) {
  const xff = request.headers.get("x-forwarded-for");

  if (xff) {
    const first = xff.split(",")[0]?.trim();

    if (first) {
      return first;
    }
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function consumeRateLimit(
  namespace: string,
  key: string,
  options: { windowMs: number; max: number },
) {
  let store = rateLimitStores.get(namespace);

  if (!store) {
    store = new Map<string, RateLimitState>();
    rateLimitStores.set(namespace, store);
  }

  const now = Date.now();
  const state = store.get(key);

  if (!state || now - state.windowStartMs > options.windowMs) {
    store.set(key, {
      windowStartMs: now,
      count: 1,
    });

    return {
      ok: true as const,
      remaining: options.max - 1,
      retryAfterMs: 0,
    };
  }

  if (state.count >= options.max) {
    const retryAfterMs = options.windowMs - (now - state.windowStartMs);

    return {
      ok: false as const,
      remaining: 0,
      retryAfterMs,
    };
  }

  state.count += 1;

  return {
    ok: true as const,
    remaining: Math.max(0, options.max - state.count),
    retryAfterMs: 0,
  };
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
