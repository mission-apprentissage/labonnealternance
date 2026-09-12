/**
 * Emprise administrative d'une recherche : `"region:53"` ou `"departement:44"`.
 * Une seule définition pour la route, le moteur et l'URL de la page de résultats
 * (cf. ban-plateforme#781).
 */

export type IAdminArea = {
  kind: "region" | "departement"
  code: string
}

/**
 * Codes INSEE réels, pas une forme approchée : une faute de frappe dans l'URL (`departement:2`,
 * `region:999`) doit être ignorée côté page et refusée côté API, plutôt que de produire une
 * recherche à zéro résultat sans explication.
 * Départements : 01…19, 2A, 2B, 21…95, 971, 972, 973, 974, 976 (975 est une collectivité). Régions (découpage 2016) : 01…06 outre-mer,
 * 11, 24, 27, 28, 32, 44, 52, 53, 75, 76, 84, 93, 94.
 */
export const ADMIN_AREA_PATTERN = /^(?:(departement):(0[1-9]|1[0-9]|2[AB1-9]|[3-8][0-9]|9[0-5]|97[1-46])|(region):(0[1-6]|11|24|27|28|32|44|52|53|75|76|84|93|94))$/

/** Renvoie null sur toute autre forme, jamais d'exception : la valeur arrive de l'URL. */
export const parseAdminArea = (value: string | undefined | null): IAdminArea | null => {
  if (!value) return null
  const match = ADMIN_AREA_PATTERN.exec(value)
  if (!match) return null
  // Deux alternatives dans la regex : les groupes de l'une sont vides quand l'autre matche.
  const kind = (match[1] ?? match[3]) as IAdminArea["kind"]
  const code = match[2] ?? match[4]
  return { kind, code }
}
