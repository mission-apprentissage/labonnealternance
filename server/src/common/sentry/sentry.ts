import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"

import config from "../../config"

function getOptions(): Sentry.NodeOptions {
  return {
    tracesSampleRate: config.env === "production" ? 0.01 : 1.0,
    tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/],
    // profilesSampleRate is relative to tracesSampleRate --> 1% of 1% = 0.01% of requests
    profilesSampleRate: 0.01,
    environment: config.env,
    release: config.version,
    enabled: config.env !== "local",
    dsn: config.serverSentryDsn,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.mongoIntegration(),
      Sentry.captureConsoleIntegration({ levels: ["error"] }),
      Sentry.extraErrorDataIntegration({ depth: 16 }),
      nodeProfilingIntegration(),
    ],
  }
}

export function initSentry(): void {
  Sentry.init(getOptions())
}

export async function closeSentry(): Promise<void> {
  await Sentry.close(2_000)
}
