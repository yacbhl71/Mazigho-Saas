type FormRateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const entries = new Map<string, FormRateLimitEntry>();

export type FormRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function consumeIndependentFormRateLimit(
  key: string,
  now = Date.now(),
): FormRateLimitResult {
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= MAX_SUBMISSIONS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetIndependentFormRateLimitForTests() {
  entries.clear();
}

export const independentFormRateLimitPolicy = {
  windowMs: WINDOW_MS,
  maxSubmissions: MAX_SUBMISSIONS_PER_WINDOW,
};
