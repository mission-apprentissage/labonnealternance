import { getApiApprentissageTestingToken, getApiApprentissageTestingTokenFromInvalidPrivateKey } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "mongodb"
import nock from "nock"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateLbaCompanyFixture } from "shared/fixtures/recruteurLba.fixture"
import { clichyFixture, generateReferentielCommuneFixtures, levalloisFixture, marseilleFixture, parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { IGeoPoint } from "shared/models"
import { IJobsPartnersOfferPrivate, IJobsPartnersWritableApiInput } from "shared/models/jobsPartners.model"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { getEtablissementFromGouvSafe } from "@/common/apis/apiEntreprise/apiEntreprise.client"
import { apiEntrepriseEtablissementFixture } from "@/common/apis/apiEntreprise/apiEntreprise.client.fixture"
import { searchForFtJobs } from "@/common/apis/franceTravail/franceTravail.client"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { certificationFixtures } from "@/services/external/api-alternance/certification.fixture"

vi.mock("@/common/apis/franceTravail/franceTravail.client")
vi.mock("@/common/apis/apiEntreprise/apiEntreprise.client")

const httpClient = useServer()

const token = getApiApprentissageTestingToken({
  email: "test@test.fr",
  organisation: "Un super Partenaire",
  habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": true },
})

const fakeToken = getApiApprentissageTestingTokenFromInvalidPrivateKey({
  email: "mail@mail.com",
  organisation: "Un super Partenaire",
  habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": true },
})

const rome = ["D1214", "D1212", "D1211"]
const rncpQuery = "RNCP37098"
const certification = certificationFixtures["RNCP37098-46T31203"]

const porteDeClichy: IGeoPoint = {
  type: "Point",
  coordinates: [2.313262, 48.894891],
}
const romesQuery = rome.join(",")
const [longitude, latitude] = porteDeClichy.coordinates
const recruteurLba = generateLbaCompanyFixture({ rome_codes: rome, geopoint: clichyFixture.centre, siret: "58006820882692", email: "email@mail.com", website: "http://site.fr" })
const jobPartnerOffer: IJobsPartnersOfferPrivate = generateJobsPartnersOfferPrivate({
  offer_rome_codes: ["D1214"],
  workplace_geopoint: parisFixture.centre,
  workplace_website: "http://site.fr",
})

const mockData = async () => {
  await getDbCollection("recruteurslba").insertOne(recruteurLba)
}

useMongo(mockData)

beforeAll(async () => {
  nock.disableNetConnect()

  return () => {
    nock.enableNetConnect()
  }
})

afterEach(() => {
  nock.cleanAll()
})

describe("GET /jobs/search", () => {
  beforeEach(async () => {
    await getDbCollection("referentiel.communes").insertMany(generateReferentielCommuneFixtures([parisFixture, clichyFixture, levalloisFixture, marseilleFixture]))
    await getDbCollection("jobs_partners").insertOne(jobPartnerOffer)
    vi.mocked(searchForFtJobs).mockResolvedValue(null)
  })

  it("should return 401 if no api key provided", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/search" })
    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unable to parse token missing-bearer" })
  })

  it("should return 401 if api key is invalid", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/search", headers: { authorization: `Bearer ${fakeToken}` } })
    expect.soft(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unable to parse token invalid-signature" })
  })

  it("should throw ZOD error if ROME is not formatted correctly", async () => {
    const romesQuery = "D4354,D864,F67"
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v2/jobs/search?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(400)
    expect(data).toEqual({
      data: {
        validationError: {
          _errors: [],
          romes: {
            _errors: ["One or more ROME codes are invalid. Expected format is 'D1234'."],
          },
        },
      },
      error: "Bad Request",
      message: "Request validation failed",
      statusCode: 400,
    })
  })

  it("should throw ZOD error if GEOLOCATION is not formatted correctly", async () => {
    const [latitude, longitude] = [300, 200]
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v2/jobs/search?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(400)
    expect(data).toEqual({
      data: {
        validationError: {
          _errors: [],
          latitude: {
            _errors: ["Latitude doit être comprise entre -90 et 90"],
          },
          longitude: {
            _errors: ["Longitude doit être comprise entre -180 et 180"],
          },
        },
      },
      error: "Bad Request",
      message: "Request validation failed",
      statusCode: 400,
    })
  })

  it("should perform search and return data", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v2/jobs/search?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(200)
    expect(data.jobs).toHaveLength(1)
    expect(data.recruiters).toHaveLength(1)

    expect(Object.keys(data.jobs[0]).toSorted()).toEqual([
      "_id",
      "apply_phone",
      "apply_url",
      "contract_duration",
      "contract_remote",
      "contract_start",
      "contract_type",
      "offer_access_conditions",
      "offer_creation",
      "offer_description",
      "offer_desired_skills",
      "offer_expiration",
      "offer_opening_count",
      "offer_rome_codes",
      "offer_status",
      "offer_target_diploma",
      "offer_title",
      "offer_to_be_acquired_skills",
      "partner_job_id",
      "partner_label",
      "workplace_address_label",
      "workplace_brand",
      "workplace_description",
      "workplace_geopoint",
      "workplace_idcc",
      "workplace_legal_name",
      "workplace_naf_code",
      "workplace_naf_label",
      "workplace_name",
      "workplace_opco",
      "workplace_siret",
      "workplace_size",
      "workplace_website",
    ])

    expect(Object.keys(data.recruiters[0]).toSorted()).toEqual([
      "_id",
      "apply_phone",
      "apply_url",
      "workplace_address_label",
      "workplace_brand",
      "workplace_description",
      "workplace_geopoint",
      "workplace_idcc",
      "workplace_legal_name",
      "workplace_naf_code",
      "workplace_naf_label",
      "workplace_name",
      "workplace_opco",
      "workplace_siret",
      "workplace_size",
      "workplace_website",
    ])
  })

  it("should support rncp param", async () => {
    const scope = nock("https://api.apprentissage.beta.gouv.fr").get(`/api/certification/v1`).query({ "identifiant.rncp": rncpQuery }).reply(200, [certification])

    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v2/jobs/search?rncp=${rncpQuery}&latitude=${latitude}&longitude=${longitude}`,
      headers: { authorization: `Bearer ${token}` },
    })

    const data = response.json()
    expect(response.statusCode).toBe(200)
    expect(data.jobs).toHaveLength(1)
    expect(data.recruiters).toHaveLength(1)
    expect(data.warnings).toEqual([])
    expect(scope.isDone()).toBe(true)
  })

  it("should require latitude when longitude is provided", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v2/jobs/search?longitude=${longitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(400)
    expect(data).toEqual({
      data: {
        validationError: {
          _errors: [],
          latitude: {
            _errors: ["latitude is required when longitude is provided"],
          },
        },
      },
      error: "Bad Request",
      message: "Request validation failed",
      statusCode: 400,
    })
  })

  it("should require longitude when latitude is provided", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v2/jobs/search?latitude=${latitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(400)
    expect(data).toEqual({
      data: {
        validationError: {
          _errors: [],
          longitude: {
            _errors: ["longitude is required when latitude is provided"],
          },
        },
      },
      error: "Bad Request",
      message: "Request validation failed",
      statusCode: 400,
    })
  })

  it("should all params be optional", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v2/jobs/search`,
      headers: { authorization: `Bearer ${token}` },
    })

    const data = response.json()
    expect(response.statusCode).toBe(200)
    expect(data.jobs).toHaveLength(1)
    expect(data.recruiters).toHaveLength(1)
    expect(data.warnings).toEqual([])
  })
})

describe("POST /jobs", async () => {
  const now = new Date("2024-06-18T00:00:00.000Z")
  const inSept = new Date("2024-09-01T00:00:00.000Z")

  const data: IJobsPartnersWritableApiInput = {
    contract_start: inSept.toJSON(),

    offer_title: "Apprentis en développement web",
    offer_rome_codes: ["M1602"],
    offer_description: "Envie de devenir développeur web ? Rejoignez-nous !",

    apply_email: "mail@mail.com",

    workplace_siret: apiEntrepriseEtablissementFixture.dinum.data.siret,
  }

  beforeEach(async () => {
    // Do not mock nextTick
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    vi.mocked(getEtablissementFromGouvSafe).mockResolvedValue(apiEntrepriseEtablissementFixture.dinum)

    nock("https://api-adresse.data.gouv.fr:443")
      .get("/search")
      .query({ q: "20 AVENUE DE SEGUR, 75007 PARIS", limit: "1" })
      .reply(200, {
        features: [{ geometry: parisFixture.centre }],
      })

    await getDbCollection("opcos").insertOne({
      _id: new ObjectId(),
      siren: "130025265",
      opco: "AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre",
      opco_short_name: "AKTO",
      idcc: 1459,
      url: null,
    })

    return () => {
      vi.useRealTimers()
    }
  })

  it("should return 403 if no token is not signed by API", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: `/api/v2/jobs`,
      body: data,
      headers: { authorization: `Bearer ${fakeToken}` },
    })

    expect.soft(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unable to parse token invalid-signature" })
    expect(await getDbCollection("jobs_partners").countDocuments({})).toBe(0)
  })

  it('should return 403 if user does not have "jobs:write" permission', async () => {
    const restrictedToken = getApiApprentissageTestingToken({
      email: "mail@mail.com",
      organisation: "Un super Partenaire",
      habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": false },
    })

    const response = await httpClient().inject({
      method: "POST",
      path: `/api/v2/jobs`,
      body: data,
      headers: { authorization: `Bearer ${restrictedToken}` },
    })

    expect.soft(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: "Forbidden", message: "Unauthorized", statusCode: 403 })
  })

  it("should create a new job offer", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: `/api/v2/jobs`,
      body: data,
      headers: { authorization: `Bearer ${token}` },
    })

    expect.soft(response.statusCode).toBe(201)
    const responseJson = response.json()
    expect(responseJson).toEqual({ id: expect.any(String) })
    expect(await getDbCollection("jobs_partners").countDocuments({ _id: new ObjectId(responseJson.id as string) })).toBe(1)
    const doc = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(responseJson.id as string) })

    // Ensure that the job offer is associated to the correct permission
    expect(doc?.partner_label).toBe("Un super Partenaire")
  })

  it("should apply method be defined", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: `/api/v2/jobs`,
      body: {
        ...data,
        apply_email: null,
        apply_phone: null,
        apply_url: null,
      },
      headers: { authorization: `Bearer ${token}` },
    })

    expect.soft(response.statusCode).toBe(400)
    const responseJson = response.json()
    expect(responseJson).toEqual({
      data: {
        validationError: {
          _errors: [],
          apply_email: {
            _errors: ["At least one of apply_url, apply_email, or apply_phone is required"],
          },
          apply_phone: {
            _errors: ["At least one of apply_url, apply_email, or apply_phone is required"],
          },
          apply_url: {
            _errors: ["At least one of apply_url, apply_email, or apply_phone is required"],
          },
        },
      },
      error: "Bad Request",
      message: "Request validation failed",
      statusCode: 400,
    })
    expect(await getDbCollection("jobs_partners").countDocuments({})).toBe(0)
  })
})

describe("PUT /jobs/:id", async () => {
  const id = new ObjectId()
  const now = new Date("2024-06-18T00:00:00.000Z")
  const inSept = new Date("2024-09-01T00:00:00.000Z")

  const originalJob = generateJobsPartnersOfferPrivate({ _id: id, offer_title: "Old title", partner_label: "Un super Partenaire" })

  const data: IJobsPartnersWritableApiInput = {
    contract_start: inSept.toJSON(),

    offer_title: "Apprentis en développement web",
    offer_rome_codes: ["M1602"],
    offer_description: "Envie de devenir développeur web ? Rejoignez-nous !",

    apply_email: "mail@mail.com",

    workplace_siret: apiEntrepriseEtablissementFixture.dinum.data.siret,
  }

  beforeEach(async () => {
    // Do not mock nextTick
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(now)

    vi.mocked(getEtablissementFromGouvSafe).mockResolvedValue(apiEntrepriseEtablissementFixture.dinum)

    nock("https://api-adresse.data.gouv.fr:443")
      .get("/search")
      .query({ q: "20 AVENUE DE SEGUR, 75007 PARIS", limit: "1" })
      .reply(200, {
        features: [{ geometry: parisFixture.centre }],
      })

    await getDbCollection("opcos").insertOne({
      _id: new ObjectId(),
      siren: "130025265",
      opco: "AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre",
      opco_short_name: "AKTO",
      idcc: 1459,
      url: null,
    })

    await getDbCollection("jobs_partners").insertOne(originalJob)

    return () => {
      vi.useRealTimers()
    }
  })

  it("should return 401 if no token is not signed by API", async () => {
    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/v2/jobs/${id.toString()}`,
      body: data,
      headers: { authorization: `Bearer ${fakeToken}` },
    })

    expect.soft(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ error: "Unauthorized", message: "Unable to parse token invalid-signature", statusCode: 401 })
    expect(await getDbCollection("jobs_partners").findOne({ _id: id })).toEqual(originalJob)
  })

  it("should update a job offer", async () => {
    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/v2/jobs/${id.toString()}`,
      body: data,
      headers: { authorization: `Bearer ${token}` },
    })

    expect.soft(response.statusCode).toBe(204)
    expect(await getDbCollection("jobs_partners").countDocuments({ _id: id })).toBe(1)
    const doc = await getDbCollection("jobs_partners").findOne({ _id: id })

    // Ensure that the job offer is associated to the correct permission
    expect(doc?.offer_title).toBe(data.offer_title)
    expect(doc).not.toEqual(originalJob)
  })

  it('should return 404 on "job does not exist"', async () => {
    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/v2/jobs/${new ObjectId().toString()}`,
      body: data,
      headers: { authorization: `Bearer ${token}` },
    })

    expect.soft(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: "Not Found", message: "Job offer not found", statusCode: 404 })
  })

  it('should return 403 if user does not have "jobs:write" permission', async () => {
    const restrictedToken = getApiApprentissageTestingToken({
      email: "mail@mail.com",
      organisation: "Un super Partenaire",
      habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": false },
    })

    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/v2/jobs/${id.toString()}`,
      body: data,
      headers: { authorization: `Bearer ${restrictedToken}` },
    })

    expect.soft(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: "Forbidden", message: "Unauthorized", statusCode: 403 })
  })

  it("should return 403 if user is trying to edit other partner_label job", async () => {
    const restrictedToken = getApiApprentissageTestingToken({
      email: "mail@mail.com",
      organisation: "Un autre",
      habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": true },
    })

    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/v2/jobs/${id.toString()}`,
      body: data,
      headers: { authorization: `Bearer ${restrictedToken}` },
    })

    expect.soft(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: "Forbidden", message: "Unauthorized", statusCode: 403 })
  })
})
