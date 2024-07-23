import { allLbaItemTypeOLD } from "shared/constants/lbaitem"

import { isOriginLocal } from "../common/utils/isOriginLocal"
import { regionCodeToDepartmentList } from "../common/utils/regionInseeCodes"

import { getRomesFromRncp } from "./certification.service"
import { TFormationSearchQuery, TJobSearchQuery } from "./jobOpportunity.service.types"

/**
 * Contrôle le format d'un code RNCP
 * @param {string} rncp le code RNCP dont on souhaite valider le format
 * @param {string[]} error_messages un tableau de messages d'erreur
 * @returns {boolean}
 */
const validateRncp = (rncp: string, error_messages: string[]) => {
  if (!/^RNCP\d{2,5}$/.test(rncp)) {
    error_messages.push("rncp : Badly formatted rncp code. RNCP code must include 'RNCP' prefix followed by 2 to 5 digit number. ex : RNCP12, RNCP12345 ...")
    return false
  } else {
    return true
  }
}

/**
 * Contrôle que les paramètres de codes ROME ou RNCP respectent les critères requis
 * ajoute les erreurs dans error_messages
 * @param {TJobSearchQuery} query les paramètres à vérifier
 * @param {string[]} error_messages un tableau de messages d'erreur
 * @param {number} romeLimit le nombre maximum de codes ROME pouvant être acceptés
 * @returns {undefined}
 */
const validateRomesOrRncp = async (query: Omit<TJobSearchQuery, "isMinimalData">, error_messages: string[], romeLimit = 20) => {
  const { romes, rncp } = query

  // codes ROME : romes
  if (romes && rncp) {
    error_messages.push("romes or rncp : You must specify either a rncp code or 1 or more rome codes.")
  } else if (romes) {
    if (romes.split(",").length > romeLimit) error_messages.push(`romes : Too many rome codes. Maximum is ${romeLimit}.`)
    if (!/^[a-zA-Z][0-9]{4}(,[a-zA-Z][0-9]{4})*$/.test(romes))
      error_messages.push("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234")
  } else if (rncp) {
    if (validateRncp(rncp, error_messages)) {
      const romesFromRncp = await getRomesFromRncp(rncp)
      if (!romesFromRncp) {
        error_messages.push(`rncp : Rncp code not recognized. Please check that it exists. (${rncp})`)
      } else {
        query.romes = romesFromRncp.join(",")
      }
    }
  } else {
    error_messages.push("romes or rncp : You must specify at least 1 rome code or a rncp code.")
  }
}

/**
 * Contrôle que les paramètres de codes ROME ou de domaine ROME respectent les critères requis
 * ajoute les erreurs dans error_messages
 * @param {string} romes une liste de codes ROME séparés par des virgules
 * @param {string} romeDomain un domaine ROME (lettre du code ROME ou lettre + premiers chiffres du code ROME)
 * @param {string[]} error_messages un tableau de messages d'erreur
 * @param {number} romeLimit le nombre maximum de codes ROME pouvant être acceptés
 * @param {boolean} optional flag indiquant si la présence de codes ROME ou d'un domaine ROME est optionnelle
 * @returns {undefined}
 */
const validateRomeOrDomain = (
  { romes, romeDomain, romeLimit = 20, optional }: { romes: string | undefined; romeDomain: string | undefined; romeLimit?: number; optional?: boolean },
  error_messages: string[]
) => {
  if (!optional && !romes && !romeDomain) {
    error_messages.push("romes, romeDomain : You must define at least 1 rome code OR a single romeDomain.")
  } else if (romes && romeDomain) {
    error_messages.push("romes, romeDomain : You must define either romes OR romeDomain, not both.")
  } else if (romes) {
    if (romes.split(",").length > romeLimit) error_messages.push(`romes : Too many rome codes. Maximum is ${romeLimit}.`)
    if (!/^[a-zA-Z][0-9]{4}(,[a-zA-Z][0-9]{4})*$/.test(romes))
      error_messages.push("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234")
  } else if (romeDomain) {
    if (!/^[a-zA-Z][0-9]{2}$/.test(romeDomain) && !/^[a-zA-Z]$/.test(romeDomain))
      error_messages.push("romeDomain : Badly formatted romeDomain. Rome domain must be one letter or one letter followed by 2 digit number. ex : A or A12")
  }
}

/**
 * Contrôle que les paramètres optionnels de codes ROME ou de domaine ROME respectent les critères requis
 * @param {string} romes une liste de codes ROME séparés par des virgules
 * @param {string} romeDomain un domaine ROME (lettre du code ROME ou lettre + premiers chiffres du code ROME)
 * @param {string[]} error_messages un tableau de messages d'erreur
 * @param {number} romeLimit le nombre maximum de codes ROME pouvant être acceptés
 * @returns {undefined}
 */
const validateOptionalRomeOrDomain = (
  { romes, romeDomain, romeLimit = 20 }: { romes: string | undefined; romeDomain: string | undefined; romeLimit?: number },
  error_messages: string[]
) => {
  validateRomeOrDomain({ romes, romeDomain, romeLimit, optional: true }, error_messages)
}

/**
 * Contrôle que les paramètres optionnels de region ou de departement respectent les critères requis
 * @param {string} region le code insee de région française
 * @param {string} departement le numéro de département
 * @param {string[]} error_messages un tableau de messages d'erreur
 * @returns {undefined}
 */
const validateOptionalRegion = ({ region, departement }: { region: string | undefined; departement: string | undefined }, error_messages: string[]) => {
  if (region && departement) {
    error_messages.push("region, departement : You must define either region OR departement, not both.")
  } else if (departement) {
    if (!/^[0-9]{2,3}$/.test(departement))
      error_messages.push("departement : Badly formatted departement. departement must be a two digit number or three digit number for overseas departments. ex : 01 or 974")
  } else if (region) {
    if (!/^[0-9]{2}$/.test(region)) error_messages.push("region : Badly formatted region. region must be a two digit number. ex : 01")

    if (Object.keys(regionCodeToDepartmentList).indexOf(region) < 0)
      error_messages.push("region : Badly formatted region. region must be one of the allowed values as described in the api online doc.")
  }
}

/**
 * Contrôle que les paramètres de région/département et de romes/romeDomain sont correctements renseignés
 * @param {string} region le code insee de région française
 * @param {string} departement le numéro de département
 * @param {string} romes une liste de codes ROME séparés par des virgules
 * @param {string} romeDomain un domaine ROME (lettre du code ROME ou lettre + premiers chiffres du code ROME)
 * @param {string[]} error_messages un tableau de messages d'erreur
 * @returns {undefined}
 */
const validateRegionOrRome = (
  { region, departement, romes, romeDomain }: { region: string | undefined; departement: string | undefined; romes: string | undefined; romeDomain: string | undefined },
  error_messages: string[]
) => {
  if (!(region || departement) && !(romes || romeDomain)) {
    error_messages.push("region, departement, romes, romeDomain : You must assign a value to at least one of these parameters.")
  }
}

/**
 * Contrôle du format correct du rayon de recherche
 * @param {number} radius le rayon
 * @param {string[]} error_messages une liste de messages d'erreur
 * @param {number} min optionnel. le rayon minimum
 * @param {number} max optionnel. le rayon maximum
 * @returns {undefined}
 */
const validateRadius = (radius: number | undefined, error_messages: string[], min = 0, max = 200) => {
  if (radius === undefined) error_messages.push("radius : Search radius is missing.")
  else if (radius < min || (radius > max && radius !== 20000)) error_messages.push(`radius : Search radius must be a number between ${min} and ${max}.`)
}

const validateLatitude = (latitude: number | undefined, error_messages: string[]) => {
  if (latitude === undefined) error_messages.push("latitude : Search center latitude is missing.")
  else if (latitude > 90 || latitude < -90) error_messages.push("latitude : Search center latitude must be a number between -90 and 90.")
}

const validateLongitude = (longitude: number | undefined, error_messages: string[]) => {
  if (longitude === undefined) error_messages.push("longitude : Search center longitude is missing.")
  else if (longitude > 180 || longitude < -180) error_messages.push("longitude : Search center longitude must be a number between -180 and 180.")
}

const validateDiploma = (diploma: string | undefined, error_messages: string[]) => {
  if (diploma && ["3", "4", "5", "6", "7"].indexOf(diploma[0]) < 0) error_messages.push("diploma : Optional diploma argument used with wrong value")
}

const validateInsee = (insee: string | undefined, error_messages: string[]) => {
  if (!insee) {
    error_messages.push("insee : insee city code is missing.")
  } else if (!/^[0-9][abAB0-9][0-9]{3}$/.test(insee)) {
    error_messages.push("insee : Badly formatted insee city code. Must be 5 digit number.")
  }
}

const validateApiSources = (apiSources: string | undefined, errorMessages: string[]) => {
  if (apiSources) {
    const sources = apiSources.split(",")
    const areSourcesOk = sources.every((source) => (allLbaItemTypeOLD as string[]).includes(source.trim()))

    if (!areSourcesOk) {
      errorMessages.push(`sources: Optional sources argument used with wrong value. Should contain comma-separated values among ${allLbaItemTypeOLD.join(", ")}.`)
    }
  }
}

/**
 * Contrôle sur le champ caller : obligatoire si appel externe, facultatif si appel depuis le front lba
 * @param {string} caller
 * @param {string} referer
 * @returns {boolean}
 */
export const validateCaller = ({ caller, referer }: { caller: string | null | undefined; referer: string | undefined }, error_messages: string[] = []) => {
  if (!isOriginLocal(referer) && !caller) {
    error_messages.push("caller : caller is missing.")
    return false
  } else return true
}

/**
 * Ensemble de contrôles complexes sur la requête de recherche d'opportunités d'emploi
 */
export const jobsQueryValidator = async (query: TJobSearchQuery): Promise<{ result: "passed"; romes: string | undefined } | { error: string; error_messages: string[] }> => {
  const error_messages = []
  const { caller, referer, latitude, longitude, insee, radius, sources } = query

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
  validateApiSources(sources, error_messages)

  if (error_messages.length) return { error: "wrong_parameters", error_messages }

  return { result: "passed", romes: query.romes }
}

/**
 * Ensemble de contrôles complexes sur la requête de recherche de formations
 * @param {TFormationSearchQuery} query paramètres de la requête
 */
export const formationsQueryValidator = async (
  query: Omit<TFormationSearchQuery, "isMinimalData">
): Promise<{ result: "passed"; romes: string | undefined } | { error: "wrong_parameters"; error_messages: string[] }> => {
  const error_messages = []

  // présence d'identifiant de la source : caller
  validateCaller({ caller: query.caller, referer: query.referer }, error_messages)

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

  return { result: "passed", romes: query.romes }
}

/**
 * Ensemble de contrôles complexes sur la requête de recherche de formations par région
 * @param {TFormationSearchQuery} query paramètres de la requête
 * @returns {{ result: "passed" } | { error: string; error_messages: string[] }}
 */
export const formationsRegionQueryValidator = (
  query: Omit<TFormationSearchQuery, "isMinimalData">
): { result: "passed" } | { error: "wrong_parameters"; error_messages: string[] } => {
  const error_messages = []

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

/**
 * Ensemble de contrôles complexes sur la requête de recherche de formations et emploi
 * @param {TFormationSearchQuery} query paramètres de la requête
 * @returns {Promise<{ result: "passed" } | { error: string; error_messages: string[] }>}
 */
export const jobsEtFormationsQueryValidator = async (
  query: Omit<TFormationSearchQuery, "isMinimalData">
): Promise<{ result: "passed"; romes: string | undefined } | { error: string; error_messages: string[] }> => {
  const error_messages = []

  // présence d'identifiant de la source : caller
  validateCaller({ caller: query.caller, referer: query.referer }, error_messages)

  // codes ROME  et code RNCP : romes, rncp. Modifie la valeur de query.romes si code rncp correct
  await validateRomesOrRncp(query, error_messages)

  // coordonnées gps optionnelles : latitude et longitude
  if (query.latitude || query.longitude) {
    validateLatitude(query.latitude, error_messages)
    validateLongitude(query.longitude, error_messages)

    // rayon de recherche : radius
    validateRadius(query.radius, error_messages)
  }

  // diploma mal formée si présente
  validateDiploma(query.diploma, error_messages)

  // code INSEE : insee
  if (query.longitude) {
    validateInsee(query.insee, error_messages)
  }

  // source mal formée si présente
  validateApiSources(query.sources, error_messages)

  if (error_messages.length) return { error: "wrong_parameters", error_messages }

  return { result: "passed", romes: query.romes }
}
