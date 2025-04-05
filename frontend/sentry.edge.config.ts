import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: "https://4d275203d4e1402e0ade461407ba7c9c@sentry.p.bksp.in/4",
    tracesSampleRate: 1,
    debug: false,
});
