// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { captureConsoleIntegration, captureRouterTransitionStart, extraErrorDataIntegration, httpClientIntegration, init, reportingObserverIntegration } from "@sentry/nextjs"

import { publicConfig } from "./config.public"

init({
  dsn: publicConfig.sentry_dsn,
  tracesSampleRate: publicConfig.env === "production" ? 0.001 : 1.0,
  tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/, publicConfig.baseUrl, publicConfig.apiEndpoint, /^\//],
  environment: publicConfig.env,
  enabled: !publicConfig.sentryDisabled,
  release: publicConfig.version,
  normalizeDepth: 8,
  // replaysOnErrorSampleRate: 1.0,
  // replaysSessionSampleRate: 0.1,
  integrations: [
    captureConsoleIntegration({ levels: ["error"] }),
    extraErrorDataIntegration({ depth: 8 }),
    httpClientIntegration({}),
    reportingObserverIntegration({ types: ["crash", "deprecation", "intervention"] }),
  ],
  sendDefaultPii: true,
  ignoreErrors: ["AbortError"],
  beforeSend(event) {
    // Hydratation error comes from DSFR
    if (event.extra?.arguments && Array.isArray(event.extra?.arguments) && event.extra?.arguments?.includes("https://react.dev/link/hydration-mismatch")) {
      return null
    }

    console.log(event)
    return event
  },
})

export const onRouterTransitionStart = captureRouterTransitionStart
