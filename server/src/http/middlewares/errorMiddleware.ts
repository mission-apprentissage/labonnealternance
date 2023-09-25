import { captureException } from "@sentry/node"
import Boom from "boom"
import { FastifyError } from "fastify"
import { ResponseValidationError } from "fastify-type-provider-zod"
import joi, { type ValidationError } from "joi"
import { IResError } from "shared/routes/common.routes"
import { ZodError } from "zod"

import { logger } from "@/common/logger"
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

export function errorMiddleware(server: Server) {
  server.setErrorHandler<FastifyError | ValidationError | Boom<unknown> | Error | ZodError, { Reply: IResError }>((rawError, _request, reply) => {
    const error = Boom.isBoom(rawError)
      ? rawError
      : // Set default error as 500
        Boom.boomify(rawError, {
          statusCode: 500,
          message: config.env === "local" ? rawError.message : "Une erreur est survenue",
          override: false,
        })

    // Fastify response validation error
    if (rawError.name === "ResponseValidationError") {
      Boom.boomify(error, {
        statusCode: 500,
        message: "Une erreur est survenue",
        override: true,
      })

      if (config.env === "local") {
        Boom.boomify(error, {
          message: getZodMessageError((rawError as ResponseValidationError).details as ZodError, "response"),
          override: true,
        })
      }
    }

    // Fastify request validation error
    if (rawError instanceof ZodError) {
      Boom.boomify(error, {
        message: getZodMessageError(rawError, (rawError as unknown as FastifyError).validationContext ?? ""),
        override: true,
      })
    }

    // Joi validation error throw from code
    if (joi.isError(rawError)) {
      return reply.status(error.output.statusCode).send({ ...error.output.payload, details: rawError.details })
    }

    if (error.output.statusCode >= 500) {
      captureException(error)
    }

    return reply.status(error.output.statusCode).send(error.output.payload)
  })
}
