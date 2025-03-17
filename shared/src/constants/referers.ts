export type ReferrerObject = {
  code: number
  name: string
  full_name: string
  url: string
}
// Referrer configurations
export const referrers = {
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

// Referrer enum values lowercased for Public API compatibility, LBA is not included
export enum ReferrerApiEnum {
  PARCOURSUP = "parcoursup",
  ONISEP = "onisep",
  JEUNE_1_SOLUTION = "jeune_1_solution",
  AFFELNET = "affelnet",
}
// Type guad
export function isValidReferrerApi(referrer: string): referrer is ReferrerApiEnum {
  return Object.values(ReferrerApiEnum).includes(referrer as ReferrerApiEnum)
}
