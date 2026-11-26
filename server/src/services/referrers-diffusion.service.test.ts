import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateEligibleTrainingEstablishmentFixture, generateEligibleTrainingFixture } from "shared/fixtures/appointment.fixture"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { applyReferrerOverrides, clearForcedActivationsAndRecompute, computeAutoReferrers, getDiffusionFlags, recomputeReferrers } from "./referrers-diffusion.service"

const ALL_ELIGIBLE = ["PARCOURSUP", "LBA", "ONISEP", "JEUNE_1_SOLUTION", "AFFELNET"] as const

describe("applyReferrerOverrides", () => {
  it("ignore un forçage « activée » sur une plateforme non éligible", () => {
    expect(applyReferrerOverrides({ auto: [], eligible: ["LBA"], forcedOn: ["PARCOURSUP"], forcedOff: [] })).toEqual([])
  })

  it("retire une plateforme automatique forcée « désactivée »", () => {
    expect(applyReferrerOverrides({ auto: ["LBA", "JEUNE_1_SOLUTION"], eligible: [...ALL_ELIGIBLE], forcedOn: [], forcedOff: ["LBA"] })).toEqual(["JEUNE_1_SOLUTION"])
  })

  it("ajoute une plateforme forcée « activée » sans la dupliquer", () => {
    expect(applyReferrerOverrides({ auto: ["LBA"], eligible: [...ALL_ELIGIBLE], forcedOn: ["LBA", "AFFELNET"], forcedOff: [] })).toEqual(["LBA", "AFFELNET"])
  })

  it("donne la priorité à la désactivation quand une plateforme est forcée dans les deux sens", () => {
    expect(applyReferrerOverrides({ auto: [], eligible: [...ALL_ELIGIBLE], forcedOn: ["AFFELNET"], forcedOff: ["AFFELNET"] })).toEqual([])
  })
})

describe("computeAutoReferrers", () => {
  it("suit l'opt-out, le premium et l'éligibilité", () => {
    const flags = getDiffusionFlags([{ optout_activation_date: new Date(), premium_activation_date: new Date() }])
    expect(computeAutoReferrers(flags, { parcoursup_visible: true, affelnet_visible: true, inReferentielOnisep: false })).toEqual(["LBA", "JEUNE_1_SOLUTION", "PARCOURSUP"])
  })

  it("ne diffuse rien quand le refus d'un établissement partageant le SIRET gestionnaire annule l'activation d'un autre", () => {
    const flags = getDiffusionFlags([{ optout_activation_date: new Date() }, { optout_refusal_date: new Date() }])
    expect(computeAutoReferrers(flags, { parcoursup_visible: true, affelnet_visible: true, inReferentielOnisep: true })).toEqual([])
  })
})

describe("recomputeReferrers et clearForcedActivationsAndRecompute", () => {
  useMongo()

  const insert = async (data: Parameters<typeof generateEligibleTrainingFixture>[0]) => {
    const etfa = generateEligibleTrainingFixture({ referrers: [], parcoursup_visible: false, affelnet_visible: true, ...data })
    await getDbCollection("eligible_trainings_for_appointments").insertOne(etfa)
    return etfa._id
  }
  const referrersOf = async (_id: ObjectId) => (await getDbCollection("eligible_trainings_for_appointments").findOne({ _id }))?.referrers

  it("conserve les forçages quand il recalcule après un changement d'opt-out", async () => {
    // Fixture : opt-out et premium Affelnet activés, formation hors référentiel ONISEP.
    await getDbCollection("etablissements").insertOne(generateEligibleTrainingEstablishmentFixture({}))
    const forcedOff = await insert({ cle_ministere_educatif: "cle-off", referrers_forced_off: ["LBA"] })
    const plain = await insert({ cle_ministere_educatif: "cle-plain" })

    const updated = await recomputeReferrers({})

    expect(updated).toBe(2)
    expect.soft(await referrersOf(forcedOff)).toEqual(["JEUNE_1_SOLUTION", "AFFELNET"])
    expect.soft(await referrersOf(plain)).toEqual(["LBA", "JEUNE_1_SOLUTION", "AFFELNET"])
  })

  it("efface au refus les forçages « activée » des plateformes refusées, pas les autres", async () => {
    await getDbCollection("etablissements").insertOne(generateEligibleTrainingEstablishmentFixture({ optout_activation_date: null, premium_affelnet_activation_date: null }))
    const forced = await insert({ cle_ministere_educatif: "cle-forced", referrers_forced_on: ["LBA", "AFFELNET"], referrers: ["LBA", "AFFELNET"] })
    const untouched = await insert({ cle_ministere_educatif: "cle-null", referrers_forced_on: null })

    await clearForcedActivationsAndRecompute({ etablissement_formateur_siret: "77572845400205" }, ["LBA", "JEUNE_1_SOLUTION", "ONISEP"])

    const saved = await getDbCollection("eligible_trainings_for_appointments").findOne({ _id: forced })
    expect.soft(saved?.referrers_forced_on).toEqual(["AFFELNET"])
    expect.soft(saved?.referrers).toEqual(["AFFELNET"])
    expect.soft((await getDbCollection("eligible_trainings_for_appointments").findOne({ _id: untouched }))?.referrers_forced_on).toBeNull()
  })

  it("lit l'éligibilité ONISEP dans le référentiel", async () => {
    await getDbCollection("etablissements").insertOne(generateEligibleTrainingEstablishmentFixture({ premium_affelnet_activation_date: null }))
    const id = await insert({ cle_ministere_educatif: "cle-onisep" })
    await getDbCollection("referentieloniseps").insertOne({ _id: new ObjectId(), id_action_ideo2: "AF.1", cle_ministere_educatif: "cle-onisep", created_at: new Date() })

    await recomputeReferrers({ _id: id })

    expect(await referrersOf(id)).toEqual(["LBA", "JEUNE_1_SOLUTION", "ONISEP"])
  })
})
