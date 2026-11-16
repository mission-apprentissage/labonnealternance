import { describe, expect, it } from "vitest"

import { getApplicationsConsultation } from "./applications-consultation.js"

const NOW = new Date("2027-01-20T10:00:00.000Z")

describe("getApplicationsConsultation", () => {
  it("laisse les candidatures d'une offre non expirée accessibles", () => {
    expect(getApplicationsConsultation("2027-02-15T23:00:00.000Z", NOW)).toEqual({ status: "offer_open" })
  })

  it("garde l'offre ouverte pendant les 24 h qui suivent son expiration", () => {
    expect(getApplicationsConsultation("2027-01-19T23:00:00.000Z", NOW)).toEqual({ status: "offer_open" })
  })

  it("donne la date limite de consultation, deux mois après l'expiration", () => {
    expect(getApplicationsConsultation("2026-12-05T08:00:00.000Z", NOW)).toEqual({ status: "consultable", until: new Date("2027-02-05T08:00:00.000Z") })
  })

  it("reste consultable jusqu'à l'instant limite inclus", () => {
    expect(getApplicationsConsultation("2026-11-20T10:00:00.000Z", NOW)).toEqual({ status: "consultable", until: NOW })
  })

  it("rend les candidatures indisponibles au-delà de deux mois", () => {
    expect(getApplicationsConsultation("2026-11-20T09:59:59.000Z", NOW)).toEqual({ status: "unavailable" })
  })

  it("compte les mois en heure de Paris quand l'intervalle traverse le passage à l'heure d'hiver", () => {
    // 10 h à Paris le 01/10 (UTC+2) → 10 h à Paris le 01/12 (UTC+1)
    expect(getApplicationsConsultation("2026-10-01T08:00:00.000Z", new Date("2026-11-16T10:00:00.000Z"))).toEqual({
      status: "consultable",
      until: new Date("2026-12-01T09:00:00.000Z"),
    })
  })

  it("garde une expiration à minuit à minuit, heure de Paris, après le passage à l'heure d'hiver", () => {
    // 01/10 à 00 h à Paris (UTC+2) → 01/12 à 00 h à Paris (UTC+1)
    expect(getApplicationsConsultation("2026-09-30T22:00:00.000Z", new Date("2026-11-16T10:00:00.000Z"))).toEqual({
      status: "consultable",
      until: new Date("2026-11-30T23:00:00.000Z"),
    })
  })

  it("ramène au dernier jour du mois quand le jour n'existe pas deux mois plus tard", () => {
    expect(getApplicationsConsultation("2026-12-31T10:00:00.000Z", NOW)).toEqual({ status: "consultable", until: new Date("2027-02-28T10:00:00.000Z") })
  })
})
