import { FastifyError, FastifyLoggerOptions, FastifyReply, FastifyRequest, RawServerDefault } from "fastify"
import { PinoLoggerOptions, ResSerializerReply } from "fastify/types/logger"

import config from "@/config"

const withoutSensibleFields = (obj: unknown, seen: Set<unknown>) => {
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
        if (lower.indexOf("token") !== -1 || ["authorization", "password", "applicant_file_content"].includes(lower)) {
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

export function logMiddleware(): FastifyLoggerOptions | PinoLoggerOptions | false {
  if (process.env.NODE_ENV === "test") {
    return false
  }

  const defaultSettings = {
    serializers: {
      req: (request: FastifyRequest) => {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          remoteAddress: request.ip,
          remotePort: request.socket.remotePort,
          requestId: request.id,
          headers: withoutSensibleFields(request.headers, new Set()),
          query: request.query,
          params: request.params,
          body: typeof request.body === "object" ? withoutSensibleFields(request.body, new Set()) : null,
        }
      },
      res: (res: ResSerializerReply<RawServerDefault, FastifyReply>) => {
        return {
          responseTime: res.getResponseTime?.() ?? null,
          statusCode: res.statusCode,
          headers: typeof res.getHeaders === "function" ? withoutSensibleFields(res.getHeaders(), new Set()) : {},
        }
      },
      err: (err: FastifyError) => {
        return {
          ...err,
          type: err.name,
          message: err.message,
          stack: err.stack,
        }
      },
    },
  }

  if (config.env === "local") {
    return {
      transport: {
        target: config.log.format === "one-line" ? "@fastify/one-line-logger" : "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    }
  } else {
    return defaultSettings
  }
}
