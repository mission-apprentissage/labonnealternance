/**
 * Emprise administrative d'une recherche : `"region:53"` ou `"departement:44"`.
 * Une seule définition pour la route, le moteur et l'URL de la page de résultats
 * (cf. ban-plateforme#781).
 */

export type IAdminArea = {
  kind: "region" | "departement"
  code: string
}

/** Codes INSEE : départements 01…95, 2A, 2B, 971…976 ; régions 01…94. */
export const ADMIN_AREA_PATTERN = /^(region|departement):([0-9]{1,3}|2[AB])$/

/** Renvoie null sur toute autre forme, jamais d'exception : la valeur arrive de l'URL. */
export const parseAdminArea = (value: string | undefined | null): IAdminArea | null => {
  if (!value) return null
  const match = ADMIN_AREA_PATTERN.exec(value)
  if (!match) return null
  return { kind: match[1] as IAdminArea["kind"], code: match[2] }
}
