import * as Sentry from "@sentry/node"

type SentryIntegration = Parameters<typeof Sentry.addIntegration>[0]

import config from "@/config"

// @sentry/profiling-node ships prebuilt native binaries indexed by Node.js ABI version.
// @sentry-internal/node-cpu-profiler@2.2.0 covers up to ABI 137 (Node 24).
// Node 25 uses ABI 141 — no prebuilt binary available, so the require() fails at runtime.
// Dynamic import with fallback allows Sentry to start normally without CPU profiling.
// To re-enable profiling on Node 25, either wait for node-cpu-profiler to ship ABI 141
// or add build tools (python3, make, g++) to the builder stage and let node-gyp compile from source.
function getProfilingIntegration(): SentryIntegration | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // biome-ignore lint/style/noCommonJs: dynamic require needed for graceful fallback when native binary is missing
    const { nodeProfilingIntegration } = require("@sentry/profiling-node")
    return nodeProfilingIntegration()
  } catch {
    return null
  }
}

function getOptions(): Sentry.NodeOptions {
  const integrations: SentryIntegration[] = [
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
