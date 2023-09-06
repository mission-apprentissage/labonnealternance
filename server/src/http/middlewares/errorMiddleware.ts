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
  } else {
    error = Boom.boomify(rawError, {
      statusCode: rawError.status || 500,
      ...(!rawError.message ? "Une erreur est survenue" : {}),
    })
  }
  return error
}

export function errorMiddleware() {
  // eslint-disable-next-line no-unused-vars
  return (rawError, req, res) => {
    req.err = rawError

    const { output } = boomify(req.err)
    return res.status(output.statusCode).send(output.payload)
  }
}
