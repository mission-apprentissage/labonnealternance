import GEIQ_WHITELIST from "../constants/geiq.js"

const GEIQ_WHITELIST_SET = new Set(GEIQ_WHITELIST)

export const isGeiqEntreprise = (siret: string | undefined | null, siretGestionnaire?: string | undefined | null): boolean => {
  return (siret != null && GEIQ_WHITELIST_SET.has(siret)) || (siretGestionnaire != null && GEIQ_WHITELIST_SET.has(siretGestionnaire))
}
