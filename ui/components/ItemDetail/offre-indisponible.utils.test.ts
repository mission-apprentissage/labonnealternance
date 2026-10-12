import type { ILbaItemJobsGlobal } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { describe, expect, it } from "vitest"

import { getOffreIndisponibilite } from "./offre-indisponible.utils"

const NOW = new Date("2026-10-06T10:00:00.000Z")

function offre({
  ideaType = LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
  status = "Active",
  jobExpirationDate = null,
}: {
  ideaType?: LBA_ITEM_TYPE
  status?: string | null
  jobExpirationDate?: string | null
}) {
  return { ideaType, job: { status, jobExpirationDate } } as unknown as ILbaItemJobsGlobal
}

describe("getOffreIndisponibilite", () => {
  it.each([["Pourvue"], ["Annulée"]])("une offre %s n'est plus disponible", (status) => {
    expect(getOffreIndisponibilite(offre({ status }), NOW)).toBe("plus_disponible")
  })

  it("une offre en attente est signalée comme telle", () => {
    expect(getOffreIndisponibilite(offre({ status: "En attente" }), NOW)).toBe("en_attente")
  })

  it("une offre active non expirée reste disponible", () => {
    expect(getOffreIndisponibilite(offre({ jobExpirationDate: "2026-12-31T00:00:00.000Z" }), NOW)).toBeNull()
  })

  it("une offre active sans date d'expiration reste disponible", () => {
    expect(getOffreIndisponibilite(offre({}), NOW)).toBeNull()
  })

  it("une offre active expirée la veille reste disponible, comme côté serveur", () => {
    expect(getOffreIndisponibilite(offre({ jobExpirationDate: "2026-10-05T11:00:00.000Z" }), NOW)).toBeNull()
  })

  it("une offre active expirée depuis plus d'un jour n'est plus disponible", () => {
    expect(getOffreIndisponibilite(offre({ jobExpirationDate: "2026-10-05T09:00:00.000Z" }), NOW)).toBe("plus_disponible")
  })

  it("une offre en attente déjà expirée n'est plus disponible", () => {
    expect(getOffreIndisponibilite(offre({ status: "En attente", jobExpirationDate: "2026-09-01T00:00:00.000Z" }), NOW)).toBe("plus_disponible")
  })

  it("une date d'expiration illisible ne rend pas l'offre indisponible", () => {
    expect(getOffreIndisponibilite(offre({ jobExpirationDate: "pas une date" }), NOW)).toBeNull()
  })

  it("s'applique aussi aux offres partenaires", () => {
    expect(getOffreIndisponibilite(offre({ ideaType: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, status: "Pourvue" }), NOW)).toBe("plus_disponible")
  })

  it("ignore les entreprises en candidature spontanée", () => {
    expect(getOffreIndisponibilite(offre({ ideaType: LBA_ITEM_TYPE.RECRUTEURS_LBA, status: "Annulée", jobExpirationDate: "2020-01-01T00:00:00.000Z" }), NOW)).toBeNull()
  })
})
