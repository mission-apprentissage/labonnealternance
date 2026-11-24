import { useMongo } from "@tests/utils/mongo.test.utils"
import { createEmailBlacklistTest } from "@tests/utils/user.test.utils"
import { generateEligibleTrainingFixture } from "shared/fixtures/appointment.fixture"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { disableEligibleTraininForAppointmentWithEmail, getEmailForRdv } from "./eligible-trainings-for-appointment.service"

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

describe("disableEligibleTraininForAppointmentWithEmail", () => {
  useMongo()

  it("coupe la diffusion et efface les forçages de l'admin RDVA", async () => {
    const etfa = generateEligibleTrainingFixture({ lieu_formation_email: "rebond@cfa-exemple.fr", referrers_forced_on: ["AFFELNET"], referrers_forced_off: ["LBA"] })
    await getDbCollection("eligible_trainings_for_appointments").insertOne(etfa)

    await disableEligibleTraininForAppointmentWithEmail("rebond@cfa-exemple.fr")

    const saved = await getDbCollection("eligible_trainings_for_appointments").findOne({ _id: etfa._id })
    expect(saved).toMatchObject({ referrers: [], lieu_formation_email: "" })
    expect.soft(saved?.referrers_forced_on).toBeUndefined()
    expect.soft(saved?.referrers_forced_off).toBeUndefined()
  })
})
