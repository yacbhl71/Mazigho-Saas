const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 3;

type RateLimitEntry = { count: number; windowStartedAt: number };
const entries = new Map<string, RateLimitEntry>();

export function consumeIndependentImageAiRateLimit(key: string, now = Date.now()) {
  const current = entries.get(key);
  if (!current || now - current.windowStartedAt >= WINDOW_MS) {
    entries.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, retryAfterSeconds: 0 } as const;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - current.windowStartedAt)) / 1000)),
    } as const;
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 } as const;
}

export function resetIndependentImageAiRateLimitForTests() {
  entries.clear();
}
