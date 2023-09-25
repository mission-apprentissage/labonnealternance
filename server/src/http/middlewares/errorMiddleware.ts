import { captureException } from "@sentry/node"
import Boom from "boom"
import { FastifyError } from "fastify"
import { ResponseValidationError } from "fastify-type-provider-zod"
import joi, { ValidationError } from "joi"
import { IResError } from "shared/routes/common.routes"
import { ZodError } from "zod"

// import { logger } from "@/common/logger"
import config from "@/config"

import { Server } from "../server"

function getZodMessageError(error: ZodError, context: string): string {
  const normalizedContext = context ? `${context}.` : ""
  return error.issues.reduce((acc, issue, i) => {
    const path = issue.path.length === 0 ? "" : issue.path.join(".")
    const delimiter = i === 0 ? "" : ", "
    return acc + `${delimiter}${normalizedContext}${path}: ${issue.message}`
  }, "")
}

export function boomify(rawError: FastifyError | ValidationError | Boom<unknown> | Error | ZodError): Boom<unknown> {
  if (Boom.isBoom(rawError)) {
    return rawError
  }

  if (rawError.name === "ResponseValidationError") {
    if (config.env === "local") {
      return Boom.internal(getZodMessageError((rawError as ResponseValidationError).details as ZodError, "response"), { rawError })
    }

    return Boom.internal("Une erreur est survenue")
  }

  if (rawError instanceof ZodError) {
    return Boom.badRequest(getZodMessageError(rawError, (rawError as unknown as FastifyError).validationContext ?? ""), { validationError: rawError })
  }

  // Joi validation error throw from code
  if (joi.isError(rawError)) {
    return Boom.badRequest(undefined, { details: rawError.details })
  }

  if (config.env === "local") {
    return Boom.internal(rawError.message, { rawError })
  }

  return Boom.internal("Une erreur est survenue")
}

export function errorMiddleware(server: Server) {
  server.setErrorHandler<FastifyError | ValidationError | Boom<unknown> | Error | ZodError, { Reply: IResError }>((rawError, _request, reply) => {
    const error = boomify(rawError)

    const payload: IResError = {
      statusCode: error.output.statusCode,
      error: error.output.payload.error,
      message: error.message,
      ...(error.data ? { data: error.data } : {}),
    }

    if (error.output.statusCode >= 500) {
      server.log.error(error)
      captureException(error)
    }

    return reply.status(payload.statusCode).send(payload)
  })
}
