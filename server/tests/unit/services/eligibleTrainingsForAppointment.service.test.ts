import { describe, expect, it } from "vitest"

import { getEmailForRdv } from "../../../src/services/eligibleTrainingsForAppointment.service"

describe("getEmailForRdv", () => {
  it("Should return the first email", async () => {
    expect(await getEmailForRdv({ email: "email1@gmail.com", etablissement_formateur_courriel: "email2@gmail.com", etablissement_formateur_siret: null })).toEqual(
      "email1@gmail.com"
    )
  })
  it("Should return the second email", async () => {
    expect(await getEmailForRdv({ email: null, etablissement_formateur_courriel: "email2@gmail.com", etablissement_formateur_siret: null })).toEqual("email2@gmail.com")
  })
})
