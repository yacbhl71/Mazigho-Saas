import * as Sentry from "@sentry/node";
import type { Express } from "express";

let enabled = false;

/**
 * Server error monitoring, active only when SENTRY_DSN is set.
 * Cookies, headers and request bodies are never sent.
 */
export function initServerMonitoring(targetApp?: Express) {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (dsn && !enabled) {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "production",
      release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
      tracesSampleRate: 0,
      beforeSend(event) {
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
          delete event.request.data;
        }
        return event;
      },
    });
    enabled = true;
  }
  if (enabled && targetApp) Sentry.setupExpressErrorHandler(targetApp);
  return enabled;
}

export function captureServerError(error: unknown, tags?: Record<string, string>) {
  if (!enabled) return;
  Sentry.captureException(error, tags ? { tags } : undefined);
  // Serverless functions may freeze right after the response: flush best-effort.
  void Sentry.flush(2000);
}
