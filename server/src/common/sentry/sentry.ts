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

// Defense-in-depth : plusieurs clients API (france-travail, diagoriente, inserjeunes...) peuvent
// laisser fuiter un AxiosError brut jusqu'à Sentry (directement ou via une exception non
// rattrapée). `extraErrorDataIntegration` sérialise alors `error.config` (headers, body, query
// params) tel quel dans `event.contexts` — cela expose un Authorization Bearer, un client_secret
// ou une clé d'API. On scrube ici toute valeur dont la clé ressemble à un secret, en plus des
// correctifs par client qui remplacent l'AxiosError par une erreur dédiée sans ces propriétés.
const SENSITIVE_KEY_PATTERN = /(authorization|cookie|secret|password|passwd|token|api[-_]?key|credential)/i
const REDACTED = "[Filtered]"

// Objets internes Node/axios (ClientRequest brut, socket, buffers de flux multipart...) : sans
// valeur de diagnostic, et le secret peut y apparaître sous une forme qu'aucune regex par
// clé/valeur ne peut fiablement reconnaître (ligne de requête HTTP brute dans `_header`/`path`,
// chunks bruts d'un corps multipart dans `_streams` où le nom de champ et sa valeur sont dans deux
// entrées de tableau distinctes). On les supprime entièrement plutôt que de tenter de les scruber.
const OPAQUE_TRANSPORT_KEY_PATTERN = /^(request|res|socket|agent|_streams|_currentRequest|httpAgent|httpsAgent)$/i

// Un corps de requête urlencoded (ex. `grant_type=client_credentials&client_secret=xxx`) ou une
// query string recopiée dans une string brute (ex. `path` d'un ClientRequest) arrive comme une
// simple string sous une clé anodine : le scrub par nom de clé ne la voit pas, il faut chercher le
// motif `clé sensible=valeur` à l'intérieur de la string elle-même.
const SENSITIVE_KV_PATTERN = /((?:client_secret|refresh_token|access_token|token|password|passwd|api[-_]?key)\s*[=:]\s*)([^&\s"']+)/gi
const BEARER_TOKEN_PATTERN = /(Bearer\s+)([A-Za-z0-9\-._~+/]+=*)/gi

function redactSecretsInString(str: string): string {
  return str.replace(SENSITIVE_KV_PATTERN, `$1${REDACTED}`).replace(BEARER_TOKEN_PATTERN, `$1${REDACTED}`)
}

function scrubSensitiveData(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (typeof value === "string") {
    return redactSecretsInString(value)
  }
  if (value === null || typeof value !== "object") {
    return value
  }
  if (seen.has(value)) {
    return value
  }
  seen.add(value)

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = scrubSensitiveData(value[i], seen)
    }
    return value
  }

  const obj = value as Record<string, unknown>
  for (const key of Object.keys(obj)) {
    obj[key] = SENSITIVE_KEY_PATTERN.test(key) || OPAQUE_TRANSPORT_KEY_PATTERN.test(key) ? REDACTED : scrubSensitiveData(obj[key], seen)
  }
  return obj
}

export function scrubSensitiveEventData(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.contexts) scrubSensitiveData(event.contexts)
  if (event.extra) scrubSensitiveData(event.extra)
  if (event.request) scrubSensitiveData(event.request)
  return event
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
      return scrubSensitiveEventData(event)
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
  Sentry.init({ ...getOptions() })
}

export async function closeSentry(): Promise<void> {
  await Sentry.close(2_000)
}
