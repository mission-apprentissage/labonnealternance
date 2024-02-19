import { describe, expect, it } from "vitest"

import { getEmailForRdv } from "../../../src/services/eligibleTrainingsForAppointment.service"
import { useMongo } from "../../utils/mongo.utils"
import { createEmailBlacklistTest } from "../../utils/user.utils"

describe("getEmailForRdv", () => {
  const blacklistedEmail = "blacklisted@email.com"

  // useMongo et générer des entrées dans emailblacklist sinon le test ne passe pas.
  const mockData = async () => {
    await createEmailBlacklistTest({ email: blacklistedEmail })
  }
  useMongo(mockData, "beforeAll")

  it("Should return the first email", async () => {
    expect(await getEmailForRdv({ email: "email1@gmail.com", etablissement_gestionnaire_courriel: "email2@gmail.com", etablissement_gestionnaire_siret: null })).toEqual(
      "email1@gmail.com"
    )
  })
  it("Should return the second email", async () => {
    expect(await getEmailForRdv({ email: null, etablissement_gestionnaire_courriel: "email2@gmail.com", etablissement_gestionnaire_siret: null })).toEqual("email2@gmail.com")
  })
  it("Should return the second email as the first one is blacklisted", async () => {
    expect(await getEmailForRdv({ email: blacklistedEmail, etablissement_gestionnaire_courriel: "email2@gmail.com", etablissement_gestionnaire_siret: null })).toEqual(
      "email2@gmail.com"
    )
  })
})
