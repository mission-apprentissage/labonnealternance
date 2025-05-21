import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"

import config from "../../config"

function getOptions(): Sentry.NodeOptions {
  return {
    tracesSampler: (samplingContext) => {
      // Continue trace decision, if there is any parentSampled information
      if (samplingContext.parentSampled != null) {
        return samplingContext.parentSampled
      }

      if (samplingContext.attributes?.["sentry.op"] === "processor.job") {
        // Sample 100% of processor jobs
        return 1.0
      }

      return config.env === "production" ? 0.01 : 1.0
    },
    tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/],
    // profilesSampleRate is relative to tracesSampleRate
    profilesSampleRate: 0.001,
    environment: config.env,
    release: config.version,
    enabled: config.env !== "local",
    dsn: config.serverSentryDsn,
    sendDefaultPii: true,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.mongoIntegration(),
      Sentry.captureConsoleIntegration({ levels: ["error"] }),
      Sentry.extraErrorDataIntegration({ depth: 16 }),
      Sentry.anrIntegration({ captureStackTrace: true }),
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
