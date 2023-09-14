// @ts-nocheck
import Boom from "boom"

function boomify(rawError) {
  let error
  if (rawError.isBoom) {
    error = rawError
  } else if (["ValidationError", "ValidateError"].includes(rawError.name)) {
    //This is a joi validation error
    error = Boom.badRequest("Erreur de validation")
    error.output.payload.details = rawError.details || rawError?.fields
  } else if (rawError instanceof Error) {
    error = Boom.boomify(rawError, {
      statusCode: rawError.status || 500,
      ...(!rawError.message ? "Une erreur est survenue" : {}),
    })
  } else {
    error = Boom.internal(typeof rawError === 'string' ? rawError : "Une erreur est survenue")
  }

  return error
}

export function errorMiddleware() {
  // Number of params matter to differentiate fallback route from error handler
  return (err, _req, res, _next) => {
    const boomError = boomify(err)
    return res.status(boomError.output.statusCode).send(boomError.output.payload)
  }
}
