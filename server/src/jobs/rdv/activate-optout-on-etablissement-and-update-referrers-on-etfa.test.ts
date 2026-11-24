import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateEligibleTrainingEstablishmentFixture, generateEligibleTrainingFixture } from "shared/fixtures/appointment.fixture"
import { describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { activateOptoutOnEtablissementAndUpdateReferrersOnETFA } from "./activate-optout-on-etablissement-and-update-referrers-on-etfa"

vi.mock("@/services/mailer.service", () => ({
  default: { sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: [] }) },
}))

describe("activateOptoutOnEtablissementAndUpdateReferrersOnETFA", () => {
  useMongo()

  it("active les formations ayant un e-mail en respectant les forçages de l'admin RDVA", async () => {
    await getDbCollection("etablissements").insertOne(
      generateEligibleTrainingEstablishmentFixture({
        optout_activation_scheduled_date: new Date("2026-01-01"),
        optout_activation_date: null,
        optout_refusal_date: null,
        premium_affelnet_activation_date: null,
      })
    )
    const forcedOff = generateEligibleTrainingFixture({ cle_ministere_educatif: "cle-off", referrers: [], referrers_forced_off: ["LBA"] })
    const plain = generateEligibleTrainingFixture({ cle_ministere_educatif: "cle-plain", referrers: [] })
    const withoutEmail = generateEligibleTrainingFixture({ cle_ministere_educatif: "cle-sans-email", referrers: [], lieu_formation_email: null })
    await getDbCollection("eligible_trainings_for_appointments").insertMany([forcedOff, plain, withoutEmail])

    await activateOptoutOnEtablissementAndUpdateReferrersOnETFA()

    const referrersOf = async (cle: string) => (await getDbCollection("eligible_trainings_for_appointments").findOne({ cle_ministere_educatif: cle }))?.referrers
    expect.soft(await referrersOf("cle-off")).toEqual(["JEUNE_1_SOLUTION"])
    expect.soft(await referrersOf("cle-plain")).toEqual(["LBA", "JEUNE_1_SOLUTION"])
    expect.soft(await referrersOf("cle-sans-email")).toEqual([])
  })
})
