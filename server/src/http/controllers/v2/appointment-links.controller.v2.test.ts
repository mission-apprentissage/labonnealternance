import { getApiApprentissageTestingToken } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { saveDbEntity } from "@tests/utils/user.test.utils"
import { generateEligibleTrainingEstablishmentFixture, generateEligibleTrainingFixture } from "shared/fixtures/appointment.fixture"
import { generateReferentielOnisepFixture } from "shared/fixtures/referentiel/onisep.fixture"
import { ZReferentielRome, zFormationCatalogueSchema } from "shared/models/index"
import type { IAppointmentLink } from "shared/routes/v2/appointments.routes.v2"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"

const getToken = (organisation: string, appointments = true) =>
  getApiApprentissageTestingToken({
    email: "test@test.fr",
    organisation,
    habilitations: { "applications:write": false, "appointments:write": appointments, "jobs:write": false },
  })

const tokens = {
  parcoursup: await getToken("parcoursup"),
  affelnet: await getToken("affelnet"),
  onisep: await getToken("onisep"),
  jeune_1_solution: await getToken("jeune_1_solution"),
  lba: await getToken("lba"),
  unknown: await getToken("Mission Apprentissage"),
  noHabilitation: await getToken("parcoursup", false),
}

const ALL_REFERRERS = ["LBA", "PARCOURSUP", "ONISEP", "JEUNE_1_SOLUTION", "AFFELNET"]

const mockData = async () => {
  await getDbCollection("etablissements").insertOne(generateEligibleTrainingEstablishmentFixture({}))
  await getDbCollection("eligible_trainings_for_appointments").insertMany([
    generateEligibleTrainingFixture({ cle_ministere_educatif: "CLEALL", parcoursup_id: "P1", referrers: ALL_REFERRERS }),
    generateEligibleTrainingFixture({ cle_ministere_educatif: "CLENOCAT", parcoursup_id: "P5", referrers: ALL_REFERRERS, training_intitule_long: "BTS HORS CATALOGUE" }),
    generateEligibleTrainingFixture({ cle_ministere_educatif: "CLENOPSUP", parcoursup_id: null, referrers: ALL_REFERRERS }),
    // Near-miss : présentes en base mais pas ouvertes au partenaire appelant
    generateEligibleTrainingFixture({ cle_ministere_educatif: "CLELBAONLY", parcoursup_id: "P2", referrers: ["LBA"] }),
    generateEligibleTrainingFixture({ cle_ministere_educatif: "CLENULLEMAIL", parcoursup_id: "P3", referrers: ALL_REFERRERS, lieu_formation_email: null }),
    generateEligibleTrainingFixture({ cle_ministere_educatif: "CLEEMPTYEMAIL", parcoursup_id: "P4", referrers: ALL_REFERRERS, lieu_formation_email: "" }),
    generateEligibleTrainingFixture({ cle_ministere_educatif: "CLENOETAB", parcoursup_id: "P6", referrers: ALL_REFERRERS, etablissement_formateur_siret: "99999999999999" }),
  ])
  await getDbCollection("referentieloniseps").insertMany([
    generateReferentielOnisepFixture({ id_action_ideo2: "AF.1", cle_ministere_educatif: "CLEALL" }),
    generateReferentielOnisepFixture({ id_action_ideo2: "AF.MULTI", cle_ministere_educatif: "CLEALL" }),
    generateReferentielOnisepFixture({ id_action_ideo2: "AF.MULTI", cle_ministere_educatif: "CLENOCAT" }),
    generateReferentielOnisepFixture({ id_action_ideo2: "AF.LBAONLY", cle_ministere_educatif: "CLELBAONLY" }),
  ])
  await saveDbEntity(ZReferentielRome, (item) => getDbCollection("referentielromes").insertOne(item), {
    rome: { code_rome: "D1102", intitule: "Boulangerie - viennoiserie", code_ogr: "D1102" },
  })
  await saveDbEntity(zFormationCatalogueSchema, (item) => getDbCollection("formationcatalogues").insertOne(item), {
    cle_ministere_educatif: "CLEALL",
    intitule_long: "CAP BOULANGER",
    rome_codes: ["D1102"],
    localite: "Tremblay-en-France",
    lieu_formation_geopoint: { type: "Point", coordinates: [2.56, 48.98] },
  })
}

useMongo(mockData)

describe("GET /v2/appointment/links", () => {
  const httpClient = useServer()

  const getLinks = async (token: string) => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v2/appointment/links", headers: { authorization: `Bearer ${token}` } })
    return { statusCode: response.statusCode, links: response.json().data as IAppointmentLink[] }
  }

  const getFormUrl = async (token: string, body: Record<string, string>) => {
    const response = await httpClient().inject({ method: "POST", path: "/api/v2/appointment", body, headers: { authorization: `Bearer ${token}` } })
    expect(response.statusCode).toBe(200)
    return response.json().form_url as string
  }

  it("401 sans token", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v2/appointment/links" })
    expect(response.statusCode).toBe(401)
  })

  it("403 sans l'habilitation appointments:write", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v2/appointment/links", headers: { authorization: `Bearer ${tokens.noHabilitation}` } })
    expect(response.statusCode).toBe(403)
  })

  it.each([["lba"], ["unknown"], ["jeune_1_solution"]] as const)("403 pour une organisation hors liste (%s)", async (organisation) => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v2/appointment/links", headers: { authorization: `Bearer ${tokens[organisation]}` } })
    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ statusCode: 403, error: "Forbidden", message: "Organisation not allowed" })
  })

  it("Parcoursup : id = parcoursup_id, formations sans parcoursup_id, non ouvertes, sans email ou sans établissement exclues", async () => {
    const { statusCode, links } = await getLinks(tokens.parcoursup)
    expect(statusCode).toBe(200)
    expect(links.map(({ id }) => id)).toEqual(["P1", "P5"])
  })

  it("Affelnet : id = cle_ministere_educatif", async () => {
    const { links } = await getLinks(tokens.affelnet)
    expect(links.map(({ id }) => id)).toEqual(["CLEALL", "CLENOCAT", "CLENOPSUP"])
  })

  it("ONISEP : une ligne par couple (id IDEO2, clé), formations sans correspondance ONISEP exclues", async () => {
    const { links } = await getLinks(tokens.onisep)
    expect(links.map(({ id, url_rdva }) => [id, new URL(url_rdva).searchParams.get("cleMinistereEducatif")])).toEqual([
      ["AF.1", "CLEALL"],
      ["AF.MULTI", "CLEALL"],
      ["AF.MULTI", "CLENOCAT"],
    ])
  })

  it("url_rdva identique au form_url de POST /v2/appointment", async () => {
    const parcoursup = await getLinks(tokens.parcoursup)
    expect(parcoursup.links.find(({ id }) => id === "P1")!.url_rdva).toBe(await getFormUrl(tokens.parcoursup, { parcoursup_id: "P1" }))

    const onisep = await getLinks(tokens.onisep)
    expect(onisep.links.find(({ id }) => id === "AF.1")!.url_rdva).toBe(await getFormUrl(tokens.onisep, { onisep_id: "AF.1" }))

    const affelnet = await getLinks(tokens.affelnet)
    expect(affelnet.links.find(({ id }) => id === "CLENOCAT")!.url_rdva).toBe(await getFormUrl(tokens.affelnet, { cle_ministere_educatif: "CLENOCAT" }))
  })

  it("url_emploi : libellé ROME autour du lieu de formation, tracé par partenaire", async () => {
    const { links } = await getLinks(tokens.parcoursup)
    const url = new URL(links.find(({ id }) => id === "P1")!.url_emploi)

    expect(url.pathname).toBe("/recherche")
    expect(Object.fromEntries(url.searchParams)).toEqual({
      mode: "emplois",
      q: "Boulangerie - viennoiserie",
      lieu_label: "Tremblay-en-France",
      latitude: "48.98",
      longitude: "2.56",
      radius: "60",
      search_source: "partner_links",
      utm_source: "parcoursup",
    })
  })

  it("url_emploi : intitulé de la formation, sans lieu, si elle est absente du catalogue", async () => {
    const { links } = await getLinks(tokens.parcoursup)
    const url = new URL(links.find(({ id }) => id === "P5")!.url_emploi)

    expect(Object.fromEntries(url.searchParams)).toEqual({ mode: "emplois", q: "BTS HORS CATALOGUE", search_source: "partner_links", utm_source: "parcoursup" })
  })
})
