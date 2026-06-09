import GEIQ_WHITELIST from "../constants/geiq.js"

export const isGeiqEntreprise = (siret: string | undefined | null, siretGestionnaire?: string | undefined | null) => {
  return (siret ? GEIQ_WHITELIST.indexOf(siret) >= 0 : false) || (siretGestionnaire ? GEIQ_WHITELIST.indexOf(siretGestionnaire) >= 0 : false)
}
