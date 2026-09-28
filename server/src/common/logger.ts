import { AsyncLocalStorage } from "node:async_hooks"

import type { FastifyBaseLogger, FastifyError, FastifyReply, FastifyRequest, RawServerDefault } from "fastify"
import type { ResSerializerReply } from "fastify/types/logger"
import type { Logger, LoggerOptions } from "pino"
import pino from "pino"

import config from "@/config"

const SENSIBLE_KEYS = new Set(["authorization", "password", "applicant_file_content", "apikey", "cookie", "set-cookie"])

const REDACTED = "[Filtered]"

const isSensibleQueryParam = (key: string): boolean => {
  const lower = key.toLowerCase()
  return lower.includes("token") || lower === "email" || SENSIBLE_KEYS.has(lower)
}

/**
 * Le masquage par nom de clé ne voit pas un secret porté dans la valeur d'une URL : lien magique en
 * query string du referer, route qui lit son jeton dans la query. On masque ces paramètres (et
 * l'email) au niveau de la chaîne, sans parser l'URL : chemin, ordre et encodage restent intacts.
 */
const redactUrl = (value: unknown): unknown => {
  if (typeof value !== "string") return value
  const queryStart = value.indexOf("?")
  if (queryStart === -1) return value
  const hashStart = value.indexOf("#", queryStart)
  const query = value.slice(queryStart + 1, hashStart === -1 ? undefined : hashStart)
  const redactedQuery = query
    .split("&")
    .map((pair) => {
      const separator = pair.indexOf("=")
      if (separator === -1) return pair
      const rawKey = pair.slice(0, separator)
      let key = rawKey
      try {
        key = decodeURIComponent(rawKey)
      } catch {
        // clé mal encodée : on la compare telle quelle
      }
      return isSensibleQueryParam(key) ? `${rawKey}=${REDACTED}` : pair
    })
    .join("&")
  return value.slice(0, queryStart + 1) + redactedQuery + (hashStart === -1 ? "" : value.slice(hashStart))
}

const URL_HEADERS = new Set(["referer", "location"])

const withRedactedUrlHeaders = (headers: unknown): unknown => {
  if (headers == null || typeof headers !== "object") return headers
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, URL_HEADERS.has(key.toLowerCase()) ? redactUrl(value) : value]))
}

const withoutSensibleFields = (obj: unknown, seen: Set<unknown>): unknown => {
  if (obj == null) return obj

  if (typeof obj === "object") {
    if (seen.has(obj)) {
      return "(ref)"
    }

    seen.add(obj)

    if (Array.isArray(obj)) {
      return obj.map((v) => withoutSensibleFields(v, seen))
    }

    if (obj instanceof Set) {
      return Array.from(obj).map((v) => withoutSensibleFields(v, seen))
    }

    if (obj instanceof Map) {
      return withoutSensibleFields(Object.fromEntries(obj.entries()), seen)
    }

    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        const lower = key.toLowerCase()
        if (lower.indexOf("token") !== -1 || SENSIBLE_KEYS.has(lower)) {
          return [key, null]
        }

        return [key, withoutSensibleFields(value, seen)]
      })
    )
  }

  if (typeof obj === "string") {
    // max 2Ko
    return obj.length > 2000 ? obj.substring(0, 2_000) + "..." : obj
  }

  return obj
}

export const serializers = {
  req: (request: FastifyRequest) => {
    return {
      method: request.method,
      url: redactUrl(request.url),
      hostname: request.hostname,
      remoteAddress: request.ip,
      remotePort: request.socket?.remotePort,
      requestId: request.id,
      headers: withRedactedUrlHeaders(withoutSensibleFields(request.headers, new Set())),
      query: withoutSensibleFields(request.query, new Set()),
      params: withoutSensibleFields(request.params, new Set()),
      body: typeof request.body === "object" ? withoutSensibleFields(request.body, new Set()) : null,
    }
  },
  res: (res: ResSerializerReply<RawServerDefault, FastifyReply>) => {
    const request = (res as ResSerializerReply<RawServerDefault, FastifyReply> & { request?: FastifyRequest }).request
    return {
      requestId: request?.id,
      method: request?.method,
      url: redactUrl(request?.url),
      responseTime: res.elapsedTime ?? null,
      statusCode: res.statusCode,
      headers: typeof res.getHeaders === "function" ? withRedactedUrlHeaders(withoutSensibleFields(res.getHeaders(), new Set())) : {},
    }
  },
  err: (err: FastifyError & { errInfo?: unknown }) => {
    return {
      ...pino.stdSerializers.err(err),
      ...(err.errInfo ? { errInfo: err.errInfo } : {}),
    }
  },
}

const destinationFd = (): 1 | 2 => {
  const destinations = config.log.destinations
  return destinations.includes("stderr") && !destinations.includes("stdout") ? 2 : 1
}

const createRootLogger = (): Logger => {
  // En test on ne veut ni log HTTP ni worker pino-pretty
  if (process.env.NODE_ENV === "test") {
    return pino({ level: "silent" })
  }

  const options: LoggerOptions = {
    name: "lba",
    level: config.log.level,
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers,
  }

  if (config.log.format === "pretty" || config.log.format === "one-line") {
    return pino({
      ...options,
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          singleLine: config.log.format === "one-line",
          destination: destinationFd(),
        },
      },
    })
  }

  // format "json" (prod) -> NDJSON pino natif sur le fd cible
  return destinationFd() === 2 ? pino(options, pino.destination(2)) : pino(options)
}

// Instance Pino racine, partagée entre les logs métier et le logger HTTP de Fastify.
let rootLogger: Logger = createRootLogger()

// Stocke le logger enfant de la requête HTTP courante (porte le reqId créé par Fastify),
// pour que les logs métier émis pendant la requête soient automatiquement corrélés.
const requestLoggerStore = new AsyncLocalStorage<Logger>()

const activeLogger = (): Logger => requestLoggerStore.getStore() ?? rootLogger

/**
 * Logger applicatif. Proxy qui résout dynamiquement le logger actif :
 * - le logger de requête (avec reqId) si on est dans le cycle de vie d'une requête HTTP ;
 * - sinon le logger racine.
 */
export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop) {
    const active = activeLogger()
    const value = active[prop as keyof Logger]
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(active) : value
  },
})

export function getLoggerWithContext(context: string) {
  return activeLogger().child({ context })
}

/**
 * Renvoie l'instance Pino racine à passer à Fastify (`loggerInstance`).
 * Typée `FastifyBaseLogger` pour que Fastify n'élargisse pas son paramètre Logger.
 */
export function getRootLogger(): FastifyBaseLogger {
  return rootLogger as unknown as FastifyBaseLogger
}

/**
 * Ajoute un contexte persistant au logger racine (utilisé par la CLI pour taguer le module).
 */
export function setRootContext(fields: Record<string, unknown>): void {
  rootLogger = rootLogger.child(fields)
}

/**
 * Active le logger de requête pour le contexte asynchrone courant.
 * À appeler dans un hook `onRequest` Fastify (le plus tôt possible).
 */
export function enterRequestLoggerContext(reqLogger: FastifyBaseLogger): void {
  requestLoggerStore.enterWith(reqLogger as unknown as Logger)
}
