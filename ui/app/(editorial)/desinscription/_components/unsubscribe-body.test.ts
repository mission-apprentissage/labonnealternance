import { describe, expect, it } from "vitest"
import { REASON_AUTRE, toUnsubscribeBody } from "./unsubscribe-body"

const email = "recrutement@entreprise.fr"

describe("toUnsubscribeBody", () => {
  it("envoie la précision avec le motif « Autre »", () => {
    expect(toUnsubscribeBody({ email, reason: REASON_AUTRE, reason_detail: "Nous changeons d'activité" })).toEqual({
      email,
      reason: REASON_AUTRE,
      reason_detail: "Nous changeons d'activité",
    })
  })

  it("n'envoie pas une précision saisie avant de changer de motif", () => {
    const body = toUnsubscribeBody({ email, reason: "L’entreprise est fermée", reason_detail: "Nous changeons d'activité" })
    expect(body).toEqual({ email, reason: "L’entreprise est fermée", reason_detail: undefined })
    expect(JSON.stringify(body)).not.toContain("reason_detail")
  })

  it("envoie une précision vide telle quelle, l'API l'enregistre à null", () => {
    expect(toUnsubscribeBody({ email, reason: REASON_AUTRE, reason_detail: "" })).toEqual({ email, reason: REASON_AUTRE, reason_detail: "" })
  })
})
