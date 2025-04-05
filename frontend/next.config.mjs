import {withSentryConfig} from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
    org: "bksp",
    project: "swynca",
    sentryUrl: "https://sentry.p.bksp.in/",
    authToken: process.env.SENTRY_AUTH_TOKEN,

    silent: !process.env.CI,

    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: true,
});