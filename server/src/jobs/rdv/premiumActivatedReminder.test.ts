import { generateEligibleTrainingEstablishmentFixture, generateEligibleTrainingFixture } from "shared/fixtures/appointment.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { premiumActivatedReminder, premiumActivatedReminderAffelnet } from "./premiumActivatedReminder"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

vi.mock("@/services/mailer.service", () => {
  return {
    default: {
      sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
    },
  }
})

describe("premiumActivatedReminder", () => {
  useMongo()

  let mailer: { sendEmail: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    const mailerModule = await import("@/services/mailer.service")
    mailer = mailerModule.default as typeof mailer
    return async () => {
      await getDbCollection("etablissements").deleteMany({})
      await getDbCollection("eligible_trainings_for_appointments").deleteMany({})
    }
  })

  it("should send emails to lieu_formation_email of eligible trainings linked to activated etablissements", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "11111111100001",
      premium_activation_date: new Date("2023-01-01"),
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "11111111100001",
      parcoursup_id: "12345",
      lieu_formation_email: "formation@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertOne(training)

    await premiumActivatedReminder()

    expect(mailer.sendEmail).toHaveBeenCalledOnce()
    expect(mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "formation@test.fr" }))
  })

  it("should not send email if etablissement has no premium_activation_date", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "22222222200002",
      premium_activation_date: null,
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "22222222200002",
      parcoursup_id: "12345",
      lieu_formation_email: "formation@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertOne(training)

    await premiumActivatedReminder()

    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })

  it("should not send email if no eligible training is linked to the etablissement", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "33333333300003",
      premium_activation_date: new Date("2023-01-01"),
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "99999999900009",
      parcoursup_id: "12345",
      lieu_formation_email: "other@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertOne(training)

    await premiumActivatedReminder()

    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })

  it("should deduplicate emails across multiple trainings for the same etablissement", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "44444444400004",
      premium_activation_date: new Date("2023-01-01"),
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training1 = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "44444444400004",
      parcoursup_id: "11111",
      lieu_formation_email: "shared@test.fr",
    })
    const training2 = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "44444444400004",
      parcoursup_id: "22222",
      lieu_formation_email: "shared@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertMany([training1, training2])

    await premiumActivatedReminder()

    expect(mailer.sendEmail).toHaveBeenCalledOnce()
    expect(mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "shared@test.fr" }))
  })

  it("should not send email if training has no parcoursup_id", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "55555555500005",
      premium_activation_date: new Date("2023-01-01"),
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "55555555500005",
      parcoursup_id: null,
      lieu_formation_email: "formation@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertOne(training)

    await premiumActivatedReminder()

    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })
})

describe("premiumActivatedReminderAffelnet", () => {
  useMongo()

  let mailer: { sendEmail: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    const mailerModule = await import("@/services/mailer.service")
    mailer = mailerModule.default as typeof mailer
    return async () => {
      await getDbCollection("etablissements").deleteMany({})
      await getDbCollection("eligible_trainings_for_appointments").deleteMany({})
    }
  })

  it("should send emails to lieu_formation_email of affelnet eligible trainings linked to activated etablissements", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "11111111100001",
      premium_affelnet_activation_date: new Date("2023-01-01"),
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "11111111100001",
      affelnet_visible: true,
      parcoursup_id: null,
      lieu_formation_email: "formation@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertOne(training)

    await premiumActivatedReminderAffelnet()

    expect(mailer.sendEmail).toHaveBeenCalledOnce()
    expect(mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "formation@test.fr" }))
  })

  it("should not send email if etablissement has no premium_affelnet_activation_date", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "22222222200002",
      premium_affelnet_activation_date: null,
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "22222222200002",
      affelnet_visible: true,
      parcoursup_id: null,
      lieu_formation_email: "formation@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertOne(training)

    await premiumActivatedReminderAffelnet()

    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })

  it("should not send email if no affelnet eligible training is linked to the etablissement", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "33333333300003",
      premium_affelnet_activation_date: new Date("2023-01-01"),
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "99999999900009",
      affelnet_visible: true,
      parcoursup_id: null,
      lieu_formation_email: "other@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertOne(training)

    await premiumActivatedReminderAffelnet()

    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })

  it("should deduplicate emails across multiple affelnet trainings for the same etablissement", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "44444444400004",
      premium_affelnet_activation_date: new Date("2023-01-01"),
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training1 = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "44444444400004",
      affelnet_visible: true,
      parcoursup_id: null,
      lieu_formation_email: "shared@test.fr",
    })
    const training2 = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "44444444400004",
      affelnet_visible: true,
      parcoursup_id: null,
      lieu_formation_email: "shared@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertMany([training1, training2])

    await premiumActivatedReminderAffelnet()

    expect(mailer.sendEmail).toHaveBeenCalledOnce()
    expect(mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "shared@test.fr" }))
  })

  it("should not send email if training is not affelnet_visible", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({
      formateur_siret: "55555555500005",
      premium_affelnet_activation_date: new Date("2023-01-01"),
      gestionnaire_email: "gestionnaire@test.fr",
    })
    const training = generateEligibleTrainingFixture({
      etablissement_formateur_siret: "55555555500005",
      affelnet_visible: false,
      parcoursup_id: null,
      lieu_formation_email: "formation@test.fr",
    })

    await getDbCollection("etablissements").insertOne(etablissement)
    await getDbCollection("eligible_trainings_for_appointments").insertOne(training)

    await premiumActivatedReminderAffelnet()

    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })
})
