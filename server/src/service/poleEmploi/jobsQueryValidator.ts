import { validateApiSources, validateCaller, validateInsee, validateLatitude, validateLongitude, validateRadius, validateRomesOrRncp } from "../queryValidators"

import { JobSearchQuery } from "./jobsAndCompanies"

const jobsQueryValidator = async (query: JobSearchQuery): Promise<{ result: "passed" } | { error: string; error_messages: string[] }> => {
  const error_messages = []
  const { caller, referer, latitude, longitude, insee, radius, sources } = query
  // contrôle des paramètres

  // présence d'identifiant de la source : caller
  validateCaller({ caller, referer }, error_messages)

  // codes ROME  et code RNCP : romes, rncp. Modifie la valeur de query.romes si code rncp correct
  await validateRomesOrRncp(query, error_messages)

  // coordonnées gps optionnelles : latitude et longitude
  if (latitude || longitude) {
    validateLatitude(latitude, error_messages)
    validateLongitude(longitude, error_messages)

    // rayon de recherche : radius
    validateRadius(radius, error_messages)

    // code INSEE : insee
    if (caller) {
      validateInsee(insee, error_messages)
    }
  }

  // source mal formée si présente
  validateApiSources(sources, error_messages, ["lbb", "lba", "offres", "matcha"])

  if (error_messages.length) return { error: "wrong_parameters", error_messages }

  return { result: "passed" }
}

export { jobsQueryValidator }
