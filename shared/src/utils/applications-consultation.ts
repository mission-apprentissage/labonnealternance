import dayjs from "../helpers/dayjs.js"
import { JOB_STATUS_ENGLISH } from "../models/job.model.js"
import { isOfferExpired } from "./offer-expiration.js"

/** Durée pendant laquelle le recruteur consulte encore les candidatures d'une offre clôturée (#5769). */
export const APPLICATIONS_CONSULTATION_MONTHS_AFTER_CLOSURE = 3

const PARIS_TIMEZONE = "Europe/Paris"

/** Clôture explicite de l'offre par son recruteur : pourvue ou annulée, à la date de ce changement de statut. */
export type IOfferClosure = { reason: "filled" | "cancelled"; date: Date | string }

/** Fin de vie de l'offre : la première de sa clôture ou de son expiration. */
export type IOfferEnd = { reason: "filled" | "cancelled" | "expired"; date: Date }

export type IApplicationsConsultation = { status: "offer_open" } | { status: "consultable"; until: Date; end: IOfferEnd } | { status: "unavailable"; until: Date; end: IOfferEnd }

const getOfferEnd = ({ expiration, closure }: { expiration: Date | string | null | undefined; closure: IOfferClosure | null }, now: Date): IOfferEnd | null => {
  const expired = expiration && isOfferExpired(expiration, now) ? { reason: "expired" as const, date: new Date(expiration) } : null
  const closed = closure ? { reason: closure.reason, date: new Date(closure.date) } : null
  if (closed && expired) return closed.date <= expired.date ? closed : expired
  return closed ?? expired
}

/** Consultation des candidatures : ouvertes tant que l'offre vit, puis 3 mois après sa clôture ou son expiration. */
export function getApplicationsConsultation(
  offer: { expiration: Date | string | null | undefined; closure: IOfferClosure | null },
  now: Date = new Date()
): IApplicationsConsultation {
  const end = getOfferEnd(offer, now)
  if (!end) {
    return { status: "offer_open" }
  }
  // add() du plugin timezone garde le décalage de départ : on ajoute les mois sur l'heure de Paris,
  // puis on relit cette heure en Europe/Paris pour qu'une fin à minuit reste à minuit après un changement d'heure.
  const parisWallClock = dayjs(end.date).tz(PARIS_TIMEZONE).add(APPLICATIONS_CONSULTATION_MONTHS_AFTER_CLOSURE, "month").format("YYYY-MM-DDTHH:mm:ss.SSS")
  const until = dayjs.tz(parisWallClock, PARIS_TIMEZONE).toDate()
  return until < now ? { status: "unavailable", until, end } : { status: "consultable", until, end }
}

/**
 * Clôture d'une offre LBA d'après son statut : la date est celle du dernier passage à ce statut dans l'historique,
 * à défaut sa dernière mise à jour (offres clôturées avant que l'historique ne soit tenu).
 */
export function getOfferClosure({
  offer_status,
  offer_status_history,
  updated_at,
}: {
  offer_status: JOB_STATUS_ENGLISH
  offer_status_history?: { status: JOB_STATUS_ENGLISH; date: Date | string }[] | null
  updated_at?: Date | string | null
}): { reason: IOfferClosure["reason"]; date: Date } | null {
  const reason = offer_status === JOB_STATUS_ENGLISH.POURVUE ? "filled" : offer_status === JOB_STATUS_ENGLISH.ANNULEE ? "cancelled" : null
  if (!reason) return null
  const date = [...(offer_status_history ?? [])].reverse().find((event) => event.status === offer_status)?.date ?? updated_at
  return date ? { reason, date: new Date(date) } : null
}
