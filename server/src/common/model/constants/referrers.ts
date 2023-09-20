import Boom from "boom"

export type ReferrerObject = {
  code: number
  name: string
  full_name: string
  url: string
}

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
    url: "https://labonnealternance.apprentissage.beta.gouv.fr",
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
    url: "https://affectation3e.phm.education.gouv.fr/pna-public",
  },
}

function isReferrer(name: string): name is keyof typeof referrers {
  return Object.keys(referrers).includes(name)
}

/**
 * @description Returns referrer from it's key.
 * @param {string} name
 * @returns {{code: {Number}, name: {String}, fullName: {String}, url: {String}}}
 */
function getReferrerByKeyName(name: string): ReferrerObject {
  const upperName = name.toUpperCase()
  if (!isReferrer(upperName)) {
    throw Boom.badRequest("Referrer introuvable.")
  }
  const referrerFound = referrers[upperName]
  return referrerFound
}

export { getReferrerByKeyName, referrers }
