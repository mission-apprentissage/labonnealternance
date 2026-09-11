// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

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
    // Avertissements de dépréciation Node émis par les internes de Next (url.parse, DEP0169…),
    // remontés par captureConsoleIntegration comme des erreurs alors qu'ils ne sont pas
    // actionnables côté LBA (Sentry LBA-UI-1B6ZZZZZZW2HZ, ~2 300 events sur 3 environnements).
    /^\(node:\d+\) \[DEP\d+\] DeprecationWarning/,
  ],
})
