// Sentry des fonctionnalités edge (middleware, edge routes) : sans rapport avec le Vercel Edge
// Runtime, nécessaire aussi en local.

import { captureConsoleIntegration, extraErrorDataIntegration, init } from "@sentry/nextjs"

import { publicConfig } from "./config.public"

init({
  dsn: publicConfig.sentry_dsn,
  tracesSampleRate: publicConfig.env === "production" ? 0.001 : 1.0,
  tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/, publicConfig.baseUrl, publicConfig.apiEndpoint],
  environment: publicConfig.env,
  enabled: !publicConfig.sentryDisabled,
  release: publicConfig.version,
  normalizeDepth: 8,
  sendDefaultPii: true,
  integrations: [captureConsoleIntegration({ levels: ["error"] }), extraErrorDataIntegration({ depth: 8 })],
  ignoreErrors: [
    "AbortError",
    // cf. sentry.server.config.ts
    /^\(node:\d+\) \[DEP\d+\] DeprecationWarning/,
  ],
})
