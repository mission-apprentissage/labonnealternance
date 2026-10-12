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

// Un AxiosError brut qui atteint Sentry (directement ou via une exception non rattrapée) voit son
// `error.config` (headers, body, query params) sérialisé tel quel par `extraErrorDataIntegration`,
// avec Bearer, client_secret ou clé d'API. Les clients API capturent donc une erreur dédiée à la
// place ; ce scrub par nom de clé est le filet de sécurité.
const SENSITIVE_KEY_PATTERN = /(authorization|cookie|secret|password|passwd|token|api[-_]?key|credential)/i
export const REDACTED = "[Filtered]"

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
// Quantificateurs bornés : coût linéaire même sur une longue chaîne qui contient un `@`.
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,24}/g

// Query des URL entrantes et sortantes : e-mail, jeton ou adresse en valeur. La query entrante utile
// au diagnostic part dans `extra.query` (cf. getDiagnosticQuery).
const URL_QUERY_KEYS: ReadonlySet<string> = new Set(["query_string", "url.query", "http.query", "http.fragment"])
const URL_KEYS: ReadonlySet<string> = new Set(["url", "http.url", "url.full", "url.path", "http.target", "referer", "http.request.header.referer"])

const stripUrlQuery = (url: string): string => url.replace(/[?#].*$/s, "")

function redactString(str: string): string {
  const withoutSecrets = str.replace(SENSITIVE_KV_PATTERN, `$1${REDACTED}`).replace(BEARER_TOKEN_PATTERN, `$1${REDACTED}`)
  // Sans `@`, le motif testerait jusqu'à 64 caractères par position pour rien (base64, requêtes...).
  return withoutSecrets.includes("@") ? withoutSecrets.replace(EMAIL_PATTERN, REDACTED) : withoutSecrets
}

function isPlainContainer(value: object): boolean {
  const prototype = Object.getPrototypeOf(value)
  return Array.isArray(value) || prototype === Object.prototype || prototype === null
}

/**
 * Renvoie une copie masquée : breadcrumbs et attributs de span peuvent référencer des objets de
 * l'application. Les objets non littéraux sont renvoyés tels quels, le SDK les normalise ensuite.
 */
function scrubSensitiveData(value: unknown, key = "", ancestors: Set<object> = new Set()): unknown {
  if (typeof value === "string") {
    return redactString(URL_KEYS.has(key.toLowerCase()) ? stripUrlQuery(value) : value)
  }
  if (value === null || typeof value !== "object" || !isPlainContainer(value)) {
    return value
  }
  if (ancestors.has(value)) {
    return REDACTED
  }
  ancestors.add(value)
  let scrubbed: unknown
  if (Array.isArray(value)) {
    scrubbed = value.map((item) => scrubSensitiveData(item, key, ancestors))
  } else {
    const obj: Record<string, unknown> = {}
    for (const [childKey, child] of Object.entries(value)) {
      // `writeErrors[].op` : document MongoDB complet de l'écriture refusée.
      if (URL_QUERY_KEYS.has(childKey) || (key === "writeErrors" && childKey === "op")) continue
      // `config.data` : corps d'une requête axios sortante.
      const isRedacted = SENSITIVE_KEY_PATTERN.test(childKey) || OPAQUE_TRANSPORT_KEY_PATTERN.test(childKey) || (key === "config" && childKey === "data")
      obj[childKey] = isRedacted ? REDACTED : scrubSensitiveData(child, childKey, ancestors)
    }
    scrubbed = obj
  }
  ancestors.delete(value)
  return scrubbed
}

type ITransactionEvent = Parameters<NonNullable<Sentry.NodeOptions["beforeSendTransaction"]>>[0]

export function scrubSensitiveEventData<T extends Sentry.ErrorEvent | ITransactionEvent>(event: T): T {
  if (event.message) event.message = redactString(event.message)
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactString(exception.value)
  }
  if (event.contexts) event.contexts = scrubSensitiveData(event.contexts) as T["contexts"]
  if (event.extra) event.extra = scrubSensitiveData(event.extra) as T["extra"]
  if (event.request) event.request = scrubSensitiveData(event.request) as T["request"]
  if (event.spans) {
    event.spans = event.spans.map((span) => ({
      ...span,
      ...(span.data ? { data: scrubSensitiveData(span.data) as typeof span.data } : {}),
    }))
  }
  return event
}

function scrubBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb {
  // Arguments bruts d'un `console.*` : une `Error` y échapperait au masquage (objet non littéral, cf.
  // scrubSensitiveData). Le message formaté, masqué, suffit.
  const { arguments: _consoleArguments, ...data } = breadcrumb.data ?? {}
  return {
    ...breadcrumb,
    ...(breadcrumb.message ? { message: redactString(breadcrumb.message) } : {}),
    ...(breadcrumb.data ? { data: scrubSensitiveData(data) as Sentry.Breadcrumb["data"] } : {}),
  }
}

export function getSentryOptions(): Sentry.NodeOptions {
  const integrations: SentryIntegration[] = [
    // Corps des requêtes entrantes (candidatures avec CV, comptes...) jamais capturé.
    Sentry.httpIntegration({ maxIncomingRequestBodySize: "none" }),
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
    beforeSendTransaction: (event) => scrubSensitiveEventData(event),
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
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
  Sentry.init(getSentryOptions())
}

export async function closeSentry(): Promise<void> {
  await Sentry.close(2_000)
}
