import type { ILbaItemJobsGlobal } from "shared"
import { JOB_STATUS } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { isOfferExpired } from "shared/utils/offer-expiration"

export type IOffreIndisponibilite = "plus_disponible" | "en_attente"

export function getOffreIndisponibilite(item: ILbaItemJobsGlobal, now: Date = new Date()): IOffreIndisponibilite | null {
  if (item.ideaType !== LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && item.ideaType !== LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) return null

  const { status, jobExpirationDate } = item.job ?? {}
  // Une offre en attente mais déjà expirée ne sera jamais publiée : « plus disponible » l'emporte.
  if (status === JOB_STATUS.POURVUE || status === JOB_STATUS.ANNULEE || isOfferExpired(jobExpirationDate, now)) return "plus_disponible"
  if (status === JOB_STATUS.EN_ATTENTE) return "en_attente"
  return null
}
