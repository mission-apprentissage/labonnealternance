import { MAX_SEARCH_ROMES } from "shared"
import { allLbaItemTypeOLD } from "shared/constants/lbaitem"
import { isOriginLocal } from "@/common/utils/is-origin-local"
import { getRomesFromRncp } from "./external/api-alternance/certification.service"
import type { TJobSearchQuery } from "./job-opportunity.service.types"

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
const validateRomesOrRncp = async (query: Omit<TJobSearchQuery, "isMinimalData">, error_messages: string[], romeLimit = MAX_SEARCH_ROMES) => {
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
