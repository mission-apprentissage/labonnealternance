import * as Sentry from "@sentry/node"

import config from "@/config"

function getProfilingIntegration(): Sentry.Integration | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { nodeProfilingIntegration } = require("@sentry/profiling-node")
    return nodeProfilingIntegration()
  } catch {
    // Native binary not available for this Node.js version (e.g. Node 25 non-LTS)
    return null
  }
}

function getOptions(): Sentry.NodeOptions {
  const integrations: Sentry.Integration[] = [
    Sentry.httpIntegration(),
    Sentry.mongoIntegration(),
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
    Sentry.extraErrorDataIntegration({ depth: 16 }),
  ]

  const profilingIntegration = getProfilingIntegration()
  if (profilingIntegration) {
    integrations.push(profilingIntegration)
  }

  return {
    beforeSend(event, hint) {
      // Filter out 4xx errors from Boom
      const error = hint.originalException
      if (error && typeof error === "object" && "isBoom" in error && error.isBoom) {
        const statusCode = (error as any).output?.statusCode
        if (statusCode && statusCode < 500) {
          return null // Don't send to Sentry
        }
      }
      return event
    },
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
    profilesSampleRate: profilingIntegration ? 0.001 : 0,
    environment: config.env,
    release: config.version,
    enabled: config.env !== "local",
    dsn: config.serverSentryDsn,
    sendDefaultPii: true,
    integrations,
  }
}

export function initSentry(): void {
  Sentry.init(getOptions())
}

export async function closeSentry(): Promise<void> {
  await Sentry.close(2_000)
}
