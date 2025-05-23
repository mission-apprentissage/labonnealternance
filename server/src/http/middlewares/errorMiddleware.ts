import { badRequest, Boom, internal, isBoom } from "@hapi/boom"
import { captureException } from "@sentry/node"
import { FastifyError } from "fastify"
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from "fastify-type-provider-zod"
import joi, { ValidationError } from "joi"
import { IResError } from "shared/routes/common.routes"
import { ZodError } from "zod"

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

export function boomify(rawError: FastifyError | ValidationError | Boom<unknown> | Error | ZodError): Boom<unknown> {
  if (isBoom(rawError)) {
    return rawError
  }

  if (isResponseSerializationError(rawError)) {
    if (config.env === "local") {
      const zodError = rawError.cause
      return internal(rawError.message, {
        validationError: zodError.format(),
      })
    }

    return internal("Une erreur est survenue")
  }

  if (hasZodFastifySchemaValidationErrors(rawError)) {
    const zodError = new ZodError(rawError.validation.map((v) => v.params.issue))
    return badRequest(getZodMessageError(zodError, rawError.validationContext ?? ""), {
      validationError: {
        code: rawError.code,
        issues: zodError.issues,
        name: "ZodError",
        statusCode: rawError.statusCode,
        validationContext: rawError.validationContext,
      },
    })
  }

  if (rawError instanceof ZodError) {
    return badRequest(getZodMessageError(rawError, ""), { validationError: rawError })
  }

  // Joi validation error throw from code
  if (joi.isError(rawError)) {
    return badRequest(undefined, { details: rawError.details })
  }

  if ((rawError as FastifyError).statusCode) {
    return new Boom(rawError.message, { statusCode: (rawError as FastifyError).statusCode, data: { rawError } })
  }

  if (config.env === "local") {
    return internal(rawError.message, { rawError, cause: rawError })
  }

  return internal("Une erreur est survenue")
}

export function errorMiddleware(server: Server) {
  server.setErrorHandler<FastifyError | ValidationError | Boom<unknown> | Error | ZodError, { Reply: IResError }>(async (rawError, request, reply) => {
    const error = boomify(rawError)

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
