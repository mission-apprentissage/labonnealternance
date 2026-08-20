import { getDbCollection } from "@/common/utils/mongodb-utils"

// Nombre d'années civiles pleines prises en compte pour le compteur "alternants recrutés".
// L'année en cours est volontairement exclue : les données DECA la concernant sont susceptibles
// d'être incomplètes (déclarations en cours, délai de remontée des contrats).
const HIRING_COUNT_YEARS_SPAN = 3

/**
 * Nombre d'alternants recrutés (contrats DECA) sur les `HIRING_COUNT_YEARS_SPAN` années civiles
 * pleines précédant `referenceDate`. Ex. si `referenceDate` est en 2026, la période couvre
 * 2023-2024-2025.
 *
 * @returns `null` si le SIRET est inconnu de la collection `deca_contrats` — à distinguer d'un
 * total de 0 contrat sur la période, qui lui est un résultat connu.
 */
export const getHiringCountLastFullYears = async (siret: string, referenceDate: Date = new Date()): Promise<number | null> => {
  const doc = await getDbCollection("deca_contrats").findOne({ siret })
  if (!doc) return null

  const currentYear = referenceDate.getFullYear()
  let total = 0
  for (let yearsAgo = 1; yearsAgo <= HIRING_COUNT_YEARS_SPAN; yearsAgo++) {
    total += doc.contrats_par_annee[String(currentYear - yearsAgo)] ?? 0
  }
  return total
}
