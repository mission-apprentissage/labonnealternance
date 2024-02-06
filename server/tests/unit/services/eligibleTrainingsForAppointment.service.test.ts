import { describe, expect, it } from "vitest"

import { getEmailForRdv } from "../../../src/services/eligibleTrainingsForAppointment.service"

describe("getEmailForRdv", () => {
  // useMongo et générer des entrées dans emailblacklist sinon le test ne passe pas.
  it.skip("Should return the first email", async () => {
    expect(await getEmailForRdv({ email: "email1@gmail.com", etablissement_gestionnaire_courriel: "email2@gmail.com", etablissement_gestionnaire_siret: null })).toEqual(
      "email1@gmail.com"
    )
  })
  it.skip("Should return the second email", async () => {
    expect(await getEmailForRdv({ email: null, etablissement_gestionnaire_courriel: "email2@gmail.com", etablissement_gestionnaire_siret: null })).toEqual("email2@gmail.com")
  })
})
