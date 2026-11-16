import dayjs from "../helpers/dayjs.js"
import { isOfferExpired } from "./offer-expiration.js"

/** Durée pendant laquelle le recruteur consulte encore les candidatures d'une offre expirée (#5769). */
export const APPLICATIONS_CONSULTATION_MONTHS_AFTER_EXPIRATION = 2

const PARIS_TIMEZONE = "Europe/Paris"

export type IApplicationsConsultation = { status: "offer_open" } | { status: "consultable"; until: Date } | { status: "unavailable" }

export function getApplicationsConsultation(expiration: Date | string, now: Date = new Date()): IApplicationsConsultation {
  if (!isOfferExpired(expiration, now)) {
    return { status: "offer_open" }
  }
  // add() du plugin timezone garde le décalage de départ : on ajoute les mois sur l'heure de Paris,
  // puis on relit cette heure en Europe/Paris pour qu'une expiration à minuit reste à minuit après un changement d'heure.
  const parisWallClock = dayjs(expiration).tz(PARIS_TIMEZONE).add(APPLICATIONS_CONSULTATION_MONTHS_AFTER_EXPIRATION, "month").format("YYYY-MM-DDTHH:mm:ss.SSS")
  const until = dayjs.tz(parisWallClock, PARIS_TIMEZONE)
  return until.isBefore(now) ? { status: "unavailable" } : { status: "consultable", until: until.toDate() }
}
