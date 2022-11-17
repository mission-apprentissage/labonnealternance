import Boom from "boom"

// Referrer configurations
const referrers = {
  PARCOURSUP: {
    code: 1,
    name: "PARCOURSUP",
    full_name: "Parcoursup",
    url: "https://www.parcoursup.fr",
  },
  LBA: {
    code: 2,
    name: "LBA",
    full_name: "La bonne alternance",
    url: "https://labonnealternance.pole-emploi.fr",
  },
  PFR_PAYS_DE_LA_LOIRE: {
    code: 3,
    name: "PFR_PAYS_DE_LA_LOIRE",
    full_name: "PFR - Pays de la Loire",
    url: "https://www.choisirmonmetier-paysdelaloire.fr",
  },
  ONISEP: {
    code: 4,
    name: "ONISEP",
    full_name: "ONISEP",
    url: "https://www.onisep.fr",
  },
  JEUNE_1_SOLUTION: {
    code: 5,
    name: "JEUNE_1_SOLUTION",
    full_name: "1 jeune 1 solution",
    url: "https://www.1jeune1solution.gouv.fr",
  },
  AFFELNET: {
    code: 6,
    name: "AFFELNET",
    full_name: "Affelnet",
    url: "https://www.ac-versailles.fr/affelnet-lycee-121477",
  },
}

/**
 * @description Returns referrer from it's key.
 * @param {string} keyName
 * @returns {{code: {Number}, name: {String}, fullName: {String}, url: {String}}}
 */
function getReferrerByKeyName(keyName) {
  const referrerFound = referrers[keyName.toUpperCase()]

  if (!referrerFound) {
    throw Boom.badRequest("Referrer introuvable.")
  }

  return referrerFound
}

/**
 * @description Returns referrer from it's identifier.
 * @param {string|number} id
 * @returns {{code: {Number}, name: {String}, fullName: {String}, url: {String}}}
 */
function getReferrerById(id) {
  const referrer = Object.values(referrers).find((referrer) => referrer.code.toString() === id.toString())

  if (!referrer) {
    throw new Error(`Unknown "${id}" referrer code.`)
  }

  return referrer
}

export { referrers, getReferrerByKeyName, getReferrerById }
