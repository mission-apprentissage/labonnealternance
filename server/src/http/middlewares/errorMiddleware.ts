import { captureException } from "@sentry/node"
import Boom from "boom"
import { FastifyError, FastifyRequest } from "fastify"
import { ResponseValidationError } from "fastify-type-provider-zod"
import joi, { ValidationError } from "joi"
import { IResError } from "shared/routes/common.routes"
import { ZodError } from "zod"

// import { logger } from "@/common/logger"
import config from "@/config"

import { stopSession } from "../../common/utils/session.service"
import { Server } from "../server"

function getZodMessageError(error: ZodError, context: string): string {
  const normalizedContext = context ? `${context}.` : ""
  return error.issues.reduce((acc, issue, i) => {
    const path = issue.path.length === 0 ? "" : issue.path.join(".")
    const delimiter = i === 0 ? "" : ", "
    return acc + `${delimiter}${normalizedContext}${path}: ${issue.message}`
  }, "")
}

function isApiV2(request: FastifyRequest): boolean {
  return request.url.startsWith("/api/v2")
}

export function boomify(rawError: FastifyError | ValidationError | Boom<unknown> | Error | ZodError, request: FastifyRequest): Boom<unknown> {
  if (Boom.isBoom(rawError)) {
    return rawError
  }

  if (rawError instanceof ResponseValidationError) {
    if (config.env === "local") {
      const zodError = new ZodError(rawError.details.error)
      return Boom.internal(rawError.message, {
        validationError: zodError.format(),
      })
    }

    return Boom.internal("Une erreur est survenue")
  }

  if (rawError instanceof ZodError) {
    if (isApiV2(request)) {
      return Boom.badRequest("Request validation failed", { validationError: rawError.format() })
    }

    return Boom.badRequest(getZodMessageError(rawError, (rawError as unknown as FastifyError).validationContext ?? ""), { validationError: rawError })
  }

  // Joi validation error throw from code
  if (joi.isError(rawError)) {
    return Boom.badRequest(undefined, { details: rawError.details })
  }

  if ((rawError as FastifyError).statusCode) {
    return new Boom(rawError.message, { statusCode: (rawError as FastifyError).statusCode, data: { rawError } })
  }

  if (config.env === "local") {
    return Boom.internal(rawError.message, { rawError, cause: rawError })
  }

  return Boom.internal("Une erreur est survenue")
}

export function errorMiddleware(server: Server) {
  server.setErrorHandler<FastifyError | ValidationError | Boom<unknown> | Error | ZodError, { Reply: IResError }>(async (rawError, request, reply) => {
    const error = boomify(rawError, request)

    if (error.output.statusCode === 403) {
      await stopSession(request, reply)
    }

    const payload: IResError = {
      statusCode: error.output.statusCode,
      error: error.output.payload.error,
      message: error.message,
      ...(error.data ? { data: error.data } : {}),
    }

    if (error.output.statusCode >= 500 || (request.url.startsWith("/api/emails/webhook") && error.output.statusCode >= 400)) {
      server.log.error(rawError)
      captureException(rawError)
    }

    return reply.status(payload.statusCode).send(payload)
  })
}
