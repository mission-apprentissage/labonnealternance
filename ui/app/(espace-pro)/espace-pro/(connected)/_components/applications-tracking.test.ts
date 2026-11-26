import { getApplicationsConsultation } from "shared/utils/applications-consultation"
import { describe, expect, it } from "vitest"
import { getApplicationStatusDimension, getOfferStateDimension, getUserTypeDimension } from "./applications-tracking"

const now = new Date("2026-11-24T12:00:00Z")

describe("dimensions Matomo du suivi des candidatures", () => {
  it("distingue l'espace du CFA de celui de l'entreprise", () => {
    expect(getUserTypeDimension("establishment")).toBe("cfa")
    expect(getUserTypeDimension(undefined)).toBe("entreprise")
  })

  it("donne le statut d'une offre ouverte, et la cause de fin d'une offre close", () => {
    const open = getApplicationsConsultation({ expiration: new Date("2026-12-24"), closure: null }, now)
    const filled = getApplicationsConsultation({ expiration: new Date("2026-12-24"), closure: { reason: "filled", date: new Date("2026-11-01") } }, now)
    const expired = getApplicationsConsultation({ expiration: new Date("2026-10-01"), closure: null }, now)

    expect(getOfferStateDimension("Active", open)).toBe("active")
    expect(getOfferStateDimension("Filled", filled)).toBe("filled")
    expect(getOfferStateDimension("Active", expired)).toBe("expired")
  })

  it("nomme pending une candidature sans réponse", () => {
    expect(getApplicationStatusDimension(null)).toBe("pending")
    expect(getApplicationStatusDimension("refus")).toBe("refus")
  })
})
