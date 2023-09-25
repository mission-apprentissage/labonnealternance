import { FastifyError, FastifyLoggerOptions, FastifyReply, FastifyRequest, RawServerDefault } from "fastify"
import { PinoLoggerOptions, ResSerializerReply } from "fastify/types/logger"
import { omitBy } from "lodash-es"

import config from "@/config"

const withoutSensibleFields = (obj: object | null | undefined) => {
  return omitBy(obj, (value, key) => {
    const lower = key.toLowerCase()
    return lower.indexOf("token") !== -1 || ["authorization", "password"].includes(lower)
  })
}

export function logMiddleware(): FastifyLoggerOptions | PinoLoggerOptions {
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
          headers: withoutSensibleFields(request.headers),
          query: request.query,
          params: request.params,
          body: typeof request.body === "object" ? withoutSensibleFields(request.body) : null,
        }
      },
      res: (res: ResSerializerReply<RawServerDefault, FastifyReply>) => {
        return {
          responseTime: res.getResponseTime?.() ?? null,
          statusCode: res.statusCode,
          headers: typeof res.getHeaders === "function" ? withoutSensibleFields(res.getHeaders()) : {},
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

  if (config.env !== "local") {
    return defaultSettings
  }

  return {
    ...defaultSettings,
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  }
}
