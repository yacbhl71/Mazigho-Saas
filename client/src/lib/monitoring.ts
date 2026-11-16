/** Browser error monitoring, loaded only when VITE_SENTRY_DSN is set (kept out of the main bundle). */
export function initClientMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  void import("@sentry/react").then(Sentry => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0,
    });
  });
}
