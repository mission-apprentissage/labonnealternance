import {
  validateRomeOrDomain,
  validateRadius,
  validateLatitude,
  validateLongitude,
  validateDiploma,
  validateOptionalRomeOrDomain,
  validateOptionalRegion,
  validateRegionOrRome,
  validateCaller,
} from "./queryValidators.js"

const formationsQueryValidator = (query) => {
  let error_messages = []

  // contrôle des paramètres

  // présence d'identifiant de la source : caller
  validateCaller({ caller: query.caller, referer: query.referer }, error_messages)

  // codes ROME : romes
  validateRomeOrDomain({ romes: query.romes, romeDomain: query.romeDomain, romeLimit: 20 }, error_messages)

  // coordonnées gps optionnelles : latitude et longitude
  if (query.latitude || query.longitude) {
    validateLatitude(query.latitude, error_messages)
    validateLongitude(query.longitude, error_messages)

    // rayon de recherche : radius
    validateRadius(query.radius, error_messages)
  }

  // diploma mal formée si présente
  validateDiploma(query.diploma, error_messages)

  if (error_messages.length) return { error: "wrong_parameters", error_messages }

  return { result: "passed" }
}

const formationsRegionQueryValidator = (query) => {
  let error_messages = []

  // contrôle des paramètres

  // présence d'identifiant de la source : caller
  validateCaller({ caller: query.caller, referer: query.referer }, error_messages)

  // codes ROME : romes ou romeDomain optionnels dans ce contexte
  validateOptionalRomeOrDomain({ romes: query.romes, romeDomain: query.romeDomain, romeLimit: 20 }, error_messages)

  // region. Soit département soit région soit aucune des deux = France entière
  validateOptionalRegion({ region: query.region, departement: query.departement }, error_messages)

  // region ou rome obligatoires (règle : si pas de region donc France entière rome devient obligatoire)
  validateRegionOrRome({ region: query.region, departement: query.departement, romes: query.romes, romeDomain: query.romeDomain }, error_messages)

  // diploma mal formée si présente
  validateDiploma(query.diploma, error_messages)

  if (error_messages.length) return { error: "wrong_parameters", error_messages }

  return { result: "passed" }
}

export { formationsQueryValidator, formationsRegionQueryValidator }
