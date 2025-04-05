import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://4d275203d4e1402e0ade461407ba7c9c@sentry.p.bksp.in/4",
  integrations: [
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  debug: false,
});