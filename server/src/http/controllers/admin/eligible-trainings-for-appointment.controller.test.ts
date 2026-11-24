import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import type { ObjectId } from "mongodb"
import type { IEligibleTrainingsForAppointment } from "shared"
import { generateEligibleTrainingEstablishmentFixture, generateEligibleTrainingFixture } from "shared/fixtures/appointment.fixture"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const SIRET = "77572845400205"

describe("admin eligible-trainings-for-appointment controller", () => {
  useMongo()
  const httpClient = useServer()

  const loginAsAdmin = async () => (await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })).bearerToken

  // Établissement de la fixture : opt-out et premium Affelnet activés, premium Parcoursup non demandé.
  const givenEtablissement = () => getDbCollection("etablissements").insertOne(generateEligibleTrainingEstablishmentFixture({}))

  const givenTraining = async (data: Partial<IEligibleTrainingsForAppointment> = {}) => {
    const etfa = generateEligibleTrainingFixture({ referrers: ["LBA", "JEUNE_1_SOLUTION", "AFFELNET"], parcoursup_visible: false, affelnet_visible: true, ...data })
    await getDbCollection("eligible_trainings_for_appointments").insertOne(etfa)
    return etfa._id
  }

  const findTraining = (_id: ObjectId) => getDbCollection("eligible_trainings_for_appointments").findOne({ _id })

  const bulk = async (headers: Record<string, string>, ids: ObjectId[], operation: object) =>
    httpClient().inject({ method: "PATCH", path: "/api/admin/eligible-trainings-for-appointment", headers, body: { ids: ids.map(String), operation } })

  describe("GET …/etablissement-formateur-siret/:siret", () => {
    it("renvoie la diffusion automatique et les plateformes éligibles de chaque formation", async () => {
      await givenEtablissement()
      await givenTraining({ cle_ministere_educatif: "cle-1", referrers_forced_off: ["LBA"], referrers: ["JEUNE_1_SOLUTION", "AFFELNET"] })

      const response = await httpClient().inject({
        method: "GET",
        path: `/api/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/${SIRET}`,
        headers: await loginAsAdmin(),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().parameters).toEqual([
        expect.objectContaining({
          referrers: ["JEUNE_1_SOLUTION", "AFFELNET"],
          referrers_forced_off: ["LBA"],
          referrers_auto: ["LBA", "JEUNE_1_SOLUTION", "AFFELNET"],
          referrers_eligible: ["LBA", "JEUNE_1_SOLUTION", "AFFELNET"],
        }),
      ])
    })
  })

  describe("PATCH /admin/eligible-trainings-for-appointment", () => {
    it("refuse un utilisateur non admin", async () => {
      const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })
      const id = await givenTraining()

      const response = await bulk(bearerToken, [id], { type: "reset_email" })

      expect(response.statusCode).toBe(403)
    })

    it("refuse un e-mail mal formé", async () => {
      const id = await givenTraining()

      const response = await bulk(await loginAsAdmin(), [id], { type: "set_email", email: "pas-un-email" })

      expect(response.statusCode).toBe(400)
    })

    it("pose l'e-mail sur les formations sélectionnées et les marque personnalisées", async () => {
      const first = await givenTraining({ cle_ministere_educatif: "cle-1", is_lieu_formation_email_customized: false })
      const second = await givenTraining({ cle_ministere_educatif: "cle-2", lieu_formation_email: "rdv@cfa-exemple.fr" })
      const other = await givenTraining({ cle_ministere_educatif: "cle-3" })

      const response = await bulk(await loginAsAdmin(), [first, second], { type: "set_email", email: "rdv@cfa-exemple.fr" })

      expect(response.statusCode).toBe(200)
      // La seconde avait déjà cet e-mail, mais pas le marqueur personnalisé.
      expect(response.json()).toEqual({ updated: 2, skipped: 0 })
      expect.soft(await findTraining(first)).toMatchObject({ lieu_formation_email: "rdv@cfa-exemple.fr", is_lieu_formation_email_customized: true })
      expect.soft(await findTraining(second)).toMatchObject({ lieu_formation_email: "rdv@cfa-exemple.fr", is_lieu_formation_email_customized: true })
      expect.soft((await findTraining(other))?.lieu_formation_email).toBe("email-formation-eligible-training@mail.fr")
      expect.soft(await getDbCollection("customemailetfas").countDocuments({ email: "rdv@cfa-exemple.fr" })).toBe(2)
    })

    it("rend la main au catalogue sans toucher l'e-mail en place", async () => {
      const id = await givenTraining({ is_lieu_formation_email_customized: true, lieu_formation_email: "rdv@cfa-exemple.fr" })

      const response = await bulk(await loginAsAdmin(), [id], { type: "reset_email" })

      expect(response.json()).toEqual({ updated: 1, skipped: 0 })
      expect(await findTraining(id)).toMatchObject({ is_lieu_formation_email_customized: false, lieu_formation_email: "rdv@cfa-exemple.fr" })
    })

    it("force une plateforme contre l'automatique et la diffusion suit", async () => {
      await givenEtablissement()
      const id = await givenTraining()

      const response = await bulk(await loginAsAdmin(), [id], {
        type: "set_referrers",
        changes: [
          { referrer: "LBA", mode: "off" },
          { referrer: "AFFELNET", mode: "on" },
        ],
      })

      expect(response.json()).toEqual({ updated: 1, skipped: 0 })
      expect(await findTraining(id)).toMatchObject({
        referrers: ["JEUNE_1_SOLUTION", "AFFELNET"],
        referrers_forced_on: ["AFFELNET"],
        referrers_forced_off: ["LBA"],
      })
    })

    it("ignore le forçage d'une plateforme non éligible et le compte", async () => {
      await givenEtablissement()
      const eligible = await givenTraining({ cle_ministere_educatif: "cle-ps", parcoursup_visible: true })
      const notEligible = await givenTraining({ cle_ministere_educatif: "cle-hors-ps", parcoursup_visible: false })

      const response = await bulk(await loginAsAdmin(), [eligible, notEligible], { type: "set_referrers", changes: [{ referrer: "PARCOURSUP", mode: "on" }] })

      expect(response.json()).toEqual({ updated: 1, skipped: 1 })
      expect.soft((await findTraining(eligible))?.referrers).toContain("PARCOURSUP")
      const skipped = await findTraining(notEligible)
      expect.soft(skipped?.referrers).toEqual(["LBA", "JEUNE_1_SOLUTION", "AFFELNET"])
      expect.soft(skipped?.referrers_forced_on).toBeUndefined()
    })

    it("repasse une plateforme en automatique", async () => {
      await givenEtablissement()
      const id = await givenTraining({ referrers: ["JEUNE_1_SOLUTION", "AFFELNET"], referrers_forced_off: ["LBA"] })

      const response = await bulk(await loginAsAdmin(), [id], { type: "set_referrers", changes: [{ referrer: "LBA", mode: "auto" }] })

      expect(response.json()).toEqual({ updated: 1, skipped: 0 })
      expect(await findTraining(id)).toMatchObject({ referrers: ["LBA", "JEUNE_1_SOLUTION", "AFFELNET"], referrers_forced_off: [] })
    })

    it("ne compte pas une formation dont rien ne change", async () => {
      await givenEtablissement()
      const id = await givenTraining()

      const response = await bulk(await loginAsAdmin(), [id], { type: "set_referrers", changes: [{ referrer: "LBA", mode: "auto" }] })

      expect(response.json()).toEqual({ updated: 0, skipped: 0 })
    })
  })
})
