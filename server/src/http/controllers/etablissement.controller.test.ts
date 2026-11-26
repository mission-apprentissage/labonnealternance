import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "mongodb"
import { generateEligibleTrainingEstablishmentFixture, generateEligibleTrainingFixture } from "shared/fixtures/appointment.fixture"
import { describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { createRdvaOptOutUnsubscribePageLink, createRdvaPremiumParcoursupPageLink } from "@/services/app-links.service"

vi.mock("@/services/mailer.service", () => ({
  default: { sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: [] }) },
}))

useMongo()
const httpClient = useServer()

describe("GET /etablissements/:id", () => {
  const insertEtablissement = async () => {
    const _id = new ObjectId()
    await getDbCollection("etablissements").insertOne({ _id, raison_sociale: "CFA Test", formateur_siret: "42476141900045", gestionnaire_siret: "42476141900045" })
    return _id
  }

  // Jeton tel qu'il part dans l'e-mail d'invitation à l'opt-out
  const tokenFor = (id: ObjectId) => new URL(createRdvaOptOutUnsubscribePageLink("cfa@example.fr", "42476141900045", id.toString())).searchParams.get("token")

  const call = async (id: string, token?: string | null) =>
    httpClient().inject({ method: "GET", url: `/api/etablissements/${id}`, headers: token ? { authorization: `Bearer ${token}` } : {} })

  it("renvoie l'établissement avec le jeton qui lui est destiné", async () => {
    const id = await insertEtablissement()

    const response = await call(id.toString(), tokenFor(id))

    expect.soft(response.statusCode).toBe(200)
    expect.soft(response.json()).toMatchObject({ _id: id.toString(), raison_sociale: "CFA Test" })
  })

  it("répond 404 pour un id inconnu, quel que soit le jeton", async () => {
    const autre = await insertEtablissement()
    const inconnu = new ObjectId()

    expect.soft((await call(inconnu.toString(), tokenFor(autre))).statusCode).toBe(404)
    expect.soft((await call(inconnu.toString())).statusCode).toBe(404)
    expect.soft((await call("id-mal-forme")).statusCode).toBe(404)
  })

  it("répond 401 sans jeton et 403 avec le jeton d'un autre établissement", async () => {
    const id = await insertEtablissement()
    const autre = await insertEtablissement()

    expect.soft((await call(id.toString())).statusCode).toBe(401)
    expect.soft((await call(id.toString(), tokenFor(autre))).statusCode).toBe(403)
  })
})

describe("refus de l'établissement et forçages de l'admin RDVA", () => {
  const SIRET = "77572845400205"
  const tokenFrom = (link: string) => new URL(link).searchParams.get("token")

  const givenTraining = async (data: Parameters<typeof generateEligibleTrainingFixture>[0]) => {
    const etfa = generateEligibleTrainingFixture({ parcoursup_visible: true, affelnet_visible: false, ...data })
    await getDbCollection("eligible_trainings_for_appointments").insertOne(etfa)
    return etfa._id
  }
  const findTraining = (_id: ObjectId) => getDbCollection("eligible_trainings_for_appointments").findOne({ _id })

  it("le désabonnement de l'opt-out efface les forçages « activée » sur LBA, 1 jeune 1 solution et ONISEP", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({ premium_activation_date: new Date("2026-01-01") })
    await getDbCollection("etablissements").insertOne(etablissement)
    const id = await givenTraining({
      referrers: ["LBA", "JEUNE_1_SOLUTION", "PARCOURSUP"],
      referrers_forced_on: ["LBA", "PARCOURSUP"],
      referrers_forced_off: ["JEUNE_1_SOLUTION"],
    })
    const token = tokenFrom(createRdvaOptOutUnsubscribePageLink("cfa@example.fr", SIRET, etablissement._id.toString()))

    const response = await httpClient().inject({
      method: "POST",
      url: `/api/etablissements/${etablissement._id}/opt-out/unsubscribe`,
      headers: { authorization: `Bearer ${token}` },
      body: {},
    })

    expect(response.statusCode).toBe(200)
    expect(await findTraining(id)).toMatchObject({
      referrers: ["PARCOURSUP"],
      referrers_forced_on: ["PARCOURSUP"],
      referrers_forced_off: ["JEUNE_1_SOLUTION"],
    })
  })

  it("le refus du premium Parcoursup efface le forçage « activée » sur Parcoursup", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({ premium_activation_date: null })
    await getDbCollection("etablissements").insertOne(etablissement)
    const id = await givenTraining({ referrers: ["LBA", "JEUNE_1_SOLUTION", "PARCOURSUP"], referrers_forced_on: ["PARCOURSUP"] })
    const token = tokenFrom(createRdvaPremiumParcoursupPageLink("cfa@example.fr", SIRET, etablissement._id.toString()))

    const response = await httpClient().inject({
      method: "POST",
      url: `/api/etablissements/${etablissement._id}/premium/refuse`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(200)
    expect(await findTraining(id)).toMatchObject({ referrers: ["LBA", "JEUNE_1_SOLUTION"], referrers_forced_on: [] })
  })

  it("l'acceptation du premium Parcoursup respecte un forçage « désactivée »", async () => {
    const etablissement = generateEligibleTrainingEstablishmentFixture({ premium_activation_date: null })
    await getDbCollection("etablissements").insertOne(etablissement)
    const forcedOff = await givenTraining({ cle_ministere_educatif: "cle-off", referrers: ["LBA", "JEUNE_1_SOLUTION"], referrers_forced_off: ["PARCOURSUP"] })
    const plain = await givenTraining({ cle_ministere_educatif: "cle-plain", referrers: ["LBA", "JEUNE_1_SOLUTION"] })
    const token = tokenFrom(createRdvaPremiumParcoursupPageLink("cfa@example.fr", SIRET, etablissement._id.toString()))

    const response = await httpClient().inject({
      method: "POST",
      url: `/api/etablissements/${etablissement._id}/premium/accept`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(200)
    expect.soft((await findTraining(forcedOff))?.referrers).toEqual(["LBA", "JEUNE_1_SOLUTION"])
    expect.soft((await findTraining(plain))?.referrers).toEqual(["LBA", "JEUNE_1_SOLUTION", "PARCOURSUP"])
  })
})
