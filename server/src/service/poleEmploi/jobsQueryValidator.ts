import { validateApiSources, validateCaller, validateInsee, validateLatitude, validateLongitude, validateRadius, validateRomes } from "../queryValidators.js"

const jobsQueryValidator = ({ caller, referer, romes, latitude, longitude, insee, radius, sources }) => {
  const error_messages = []

  // contrôle des paramètres

  // présence d'identifiant de la source : caller
  validateCaller({ caller, referer }, error_messages)

  // codes ROME : romes
  validateRomes(romes, error_messages)

  // coordonnées gps optionnelles : latitude et longitude
  if (latitude || longitude) {
    validateLatitude(latitude, error_messages)
    validateLongitude(longitude, error_messages)

    // rayon de recherche : radius
    validateRadius(radius, error_messages)
  }

  // code INSEE : insee
  if (caller && (longitude || longitude)) {
    validateInsee(insee, error_messages)
  }

  // source mal formée si présente
  validateApiSources(sources, error_messages, ["lbb", "lba", "offres", "matcha"])

  if (error_messages.length) return { error: "wrong_parameters", error_messages }

  return { result: "passed" }
}

export { jobsQueryValidator }
