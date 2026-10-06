import type { ILbaItemJobsGlobal } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

export type IOffreIndisponibilite = "plus_disponible" | "en_attente"

const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Même règle que le refus de candidature côté serveur (cf. sendApplicationV2) : l'offre reste
// ouverte toute la journée qui suit sa date d'expiration.
function isExpired(expirationDate: Date | string | null | undefined, now: Date): boolean {
  if (!expirationDate) return false
  const expiration = new Date(expirationDate).getTime()
  return !Number.isNaN(expiration) && expiration + ONE_DAY_MS < now.getTime()
}

export function getOffreIndisponibilite(item: ILbaItemJobsGlobal, now: Date = new Date()): IOffreIndisponibilite | null {
  if (item.ideaType !== LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && item.ideaType !== LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) return null

  const { status, jobExpirationDate } = item.job ?? {}
  // Une offre en attente mais déjà expirée ne sera jamais publiée : « plus disponible » l'emporte.
  if (status === "Pourvue" || status === "Annulée" || isExpired(jobExpirationDate, now)) return "plus_disponible"
  if (status === "En attente") return "en_attente"
  return null
}
