import { describe, expect, it } from "vitest"

import { JOB_STATUS_ENGLISH } from "../models/job.model.js"
import { getApplicationsConsultation, getOfferClosure } from "./applications-consultation.js"

const NOW = new Date("2027-01-20T10:00:00.000Z")
const expiredOn = (expiration: string, now = NOW) => getApplicationsConsultation({ expiration, closure: null }, now)

describe("getApplicationsConsultation", () => {
  it("laisse les candidatures d'une offre non expirée et non clôturée accessibles", () => {
    expect(expiredOn("2027-02-15T23:00:00.000Z")).toEqual({ status: "offer_open" })
  })

  it("garde l'offre ouverte pendant les 24 h qui suivent son expiration", () => {
    expect(expiredOn("2027-01-19T23:00:00.000Z")).toEqual({ status: "offer_open" })
  })

  it("donne la date limite de consultation, trois mois après l'expiration", () => {
    expect(expiredOn("2026-11-05T08:00:00.000Z")).toEqual({
      status: "consultable",
      until: new Date("2027-02-05T08:00:00.000Z"),
      end: { reason: "expired", date: new Date("2026-11-05T08:00:00.000Z") },
    })
  })

  it("reste consultable jusqu'à l'instant limite inclus", () => {
    // Novembre et février sont tous deux à l'heure d'hiver : la limite tombe à la même heure UTC.
    const now = new Date("2027-02-20T10:00:00.000Z")
    expect(expiredOn("2026-11-20T10:00:00.000Z", now)).toMatchObject({ status: "consultable", until: now })
  })

  it("rend les candidatures indisponibles au-delà de trois mois", () => {
    expect(expiredOn("2026-11-20T09:59:59.000Z", new Date("2027-02-20T10:00:00.000Z"))).toMatchObject({ status: "unavailable" })
  })

  it("part de la clôture d'une offre pourvue, même si elle n'a pas encore expiré", () => {
    expect(getApplicationsConsultation({ expiration: "2027-06-01T22:00:00.000Z", closure: { reason: "filled", date: "2027-01-10T09:00:00.000Z" } }, NOW)).toEqual({
      status: "consultable",
      until: new Date("2027-04-10T08:00:00.000Z"),
      end: { reason: "filled", date: new Date("2027-01-10T09:00:00.000Z") },
    })
  })

  it("retient l'expiration quand l'offre a expiré avant d'être clôturée", () => {
    expect(getApplicationsConsultation({ expiration: "2026-11-05T08:00:00.000Z", closure: { reason: "cancelled", date: "2027-01-10T09:00:00.000Z" } }, NOW)).toMatchObject({
      status: "consultable",
      end: { reason: "expired" },
    })
  })

  it("compte les mois en heure de Paris quand l'intervalle traverse le passage à l'heure d'hiver", () => {
    // 10 h à Paris le 01/09 (UTC+2) → 10 h à Paris le 01/12 (UTC+1)
    expect(expiredOn("2026-09-01T08:00:00.000Z", new Date("2026-11-16T10:00:00.000Z"))).toMatchObject({
      status: "consultable",
      until: new Date("2026-12-01T09:00:00.000Z"),
    })
  })

  it("garde une expiration à minuit à minuit, heure de Paris, après le passage à l'heure d'hiver", () => {
    // 01/09 à 00 h à Paris (UTC+2) → 01/12 à 00 h à Paris (UTC+1)
    expect(expiredOn("2026-08-31T22:00:00.000Z", new Date("2026-11-16T10:00:00.000Z"))).toMatchObject({
      status: "consultable",
      until: new Date("2026-11-30T23:00:00.000Z"),
    })
  })

  it("ramène au dernier jour du mois quand le jour n'existe pas trois mois plus tard", () => {
    expect(expiredOn("2026-11-30T10:00:00.000Z", new Date("2027-01-20T10:00:00.000Z"))).toMatchObject({ until: new Date("2027-02-28T10:00:00.000Z") })
  })
})

describe("getOfferClosure", () => {
  it("prend la date du dernier passage au statut actuel", () => {
    expect(
      getOfferClosure({
        offer_status: JOB_STATUS_ENGLISH.POURVUE,
        offer_status_history: [
          { status: JOB_STATUS_ENGLISH.POURVUE, date: new Date("2026-10-01T10:00:00.000Z") },
          { status: JOB_STATUS_ENGLISH.ACTIVE, date: new Date("2026-10-05T10:00:00.000Z") },
          { status: JOB_STATUS_ENGLISH.POURVUE, date: new Date("2026-10-10T10:00:00.000Z") },
        ],
        updated_at: new Date("2026-11-01T10:00:00.000Z"),
      })
    ).toEqual({ reason: "filled", date: new Date("2026-10-10T10:00:00.000Z") })
  })

  it("se rabat sur la dernière mise à jour sans historique", () => {
    expect(getOfferClosure({ offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [], updated_at: new Date("2026-11-01T10:00:00.000Z") })).toEqual({
      reason: "cancelled",
      date: new Date("2026-11-01T10:00:00.000Z"),
    })
  })

  it("ne voit pas de clôture sur une offre active", () => {
    expect(getOfferClosure({ offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_status_history: [], updated_at: new Date() })).toBeNull()
  })
})
