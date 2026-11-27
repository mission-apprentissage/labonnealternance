import { SMIC } from "@/config/simulateur-alternant"

const SMIC_METROPOLE = SMIC.metropole

const formatEuros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
const formatEurosArrondis = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 })
const formatDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })

/** Montant mensuel brut pour un pourcentage du SMIC, arrondi au centime (ou à l'euro avec `arrondi`). */
export const formatMontantSmicMensuel = (pourcentage: number, { arrondi = false }: { arrondi?: boolean } = {}): string => {
  const montant = Math.round(pourcentage * SMIC_METROPOLE.brut.mensuel) / 100
  return arrondi ? formatEurosArrondis.format(montant) : formatEuros.format(montant)
}

export const SMIC_HORAIRE_BRUT = formatEuros.format(SMIC_METROPOLE.brut.horaire)

/** Date d'effet du barème, au format « 1er décembre 2026 ». */
export const DATE_EFFET_SMIC = formatDate.format(SMIC.dateEffet).replace(/^1 /, "1er ")

const formatNombreArrondi = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })

/** Fourchette légale du salaire apprenti, de 27 % à 100 % du SMIC, au format des KPI des pages diplôme (« 512€ - 1 897€ »). */
export const FOURCHETTE_SALAIRE_APPRENTISSAGE = `${formatNombreArrondi.format((27 * SMIC_METROPOLE.brut.mensuel) / 100)}€ - ${formatNombreArrondi.format(SMIC_METROPOLE.brut.mensuel)}€`
