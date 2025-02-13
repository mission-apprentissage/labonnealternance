import dayjs from "dayjs"
import { ObjectId } from "mongodb"
import nock from "nock"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateFeaturePropertyFixture } from "shared/fixtures/geolocation.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { clichyFixture, generateReferentielCommuneFixtures, levalloisFixture, marseilleFixture, parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { IGeoPoint } from "shared/models"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import type { IJobOfferApiWriteV3Input } from "shared/routes/v3/jobs/jobs.routes.v3.model"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { getEtablissementFromGouvSafe } from "@/common/apis/apiEntreprise/apiEntreprise.client"
import { apiEntrepriseEtablissementFixture } from "@/common/apis/apiEntreprise/apiEntreprise.client.fixture"
import { searchForFtJobs } from "@/common/apis/franceTravail/franceTravail.client"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { certificationFixtures } from "@/services/external/api-alternance/certification.fixture"
import { getApiApprentissageTestingToken, getApiApprentissageTestingTokenFromInvalidPrivateKey } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

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
const expirationDate = dayjs().add(1, "months").toDate()
const [longitude, latitude] = porteDeClichy.coordinates
const recruteurLba = generateJobsPartnersOfferPrivate({
  partner_label: LBA_ITEM_TYPE.RECRUTEURS_LBA,
  offer_rome_codes: rome,
  workplace_geopoint: clichyFixture.centre,
  workplace_siret: "58006820882692",
  apply_email: "email@mail.com",
  workplace_website: "http://site.fr",
})
const jobPartnerOffer: IJobsPartnersOfferPrivate = generateJobsPartnersOfferPrivate({
  offer_rome_codes: ["D1214"],
  workplace_geopoint: parisFixture.centre,
  workplace_website: "http://site.fr",
  offer_expiration: expirationDate,
})

useMongo()

beforeAll(async () => {
  nock.disableNetConnect()

  return () => {
    nock.enableNetConnect()
  }
})

afterEach(() => {
  nock.cleanAll()
})

describe("GET /v3/jobs/search", () => {
  beforeEach(async () => {
    await getDbCollection("referentiel.communes").insertMany(generateReferentielCommuneFixtures([parisFixture, clichyFixture, levalloisFixture, marseilleFixture]))
    await getDbCollection("jobs_partners").insertOne(jobPartnerOffer)
    await getDbCollection("jobs_partners").insertOne(recruteurLba)
    vi.mocked(searchForFtJobs).mockResolvedValue(null)
  })

  it("should return 401 if no api key provided", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v3/jobs/search" })
    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unable to parse token missing-bearer" })
  })

  it("should return 401 if api key is invalid", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v3/jobs/search", headers: { authorization: `Bearer ${fakeToken}` } })
    expect.soft(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unable to parse token invalid-signature" })
  })

  it("should throw ZOD error if ROME is not formatted correctly", async () => {
    const romesQuery = "D4354,D864,F67"
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v3/jobs/search?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(400)
    expect(data).toEqual({
      data: {
        validationError: {
          code: "FST_ERR_VALIDATION",
          issues: [
            {
              code: "custom",
              message: "One or more ROME codes are invalid. Expected format is 'D1234'.",
              path: ["romes"],
            },
          ],
          name: "ZodError",
          statusCode: 400,
          validationContext: "querystring",
        },
      },
      error: "Bad Request",
      message: "querystring.romes: One or more ROME codes are invalid. Expected format is 'D1234'.",
      statusCode: 400,
    })
  })

  it("should throw ZOD error if GEOLOCATION is not formatted correctly", async () => {
    const [latitude, longitude] = [300, 200]
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v3/jobs/search?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(400)
    expect(data).toEqual({
      data: {
        validationError: {
          code: "FST_ERR_VALIDATION",
          issues: [
            {
              code: "too_big",
              exact: false,
              inclusive: true,
              maximum: 90,
              message: "Latitude doit être comprise entre -90 et 90",
              path: ["latitude"],
              type: "number",
            },

            {
              code: "too_big",
              exact: false,
              inclusive: true,
              maximum: 180,
              message: "Longitude doit être comprise entre -180 et 180",
              path: ["longitude"],
              type: "number",
            },
          ],
          name: "ZodError",
          statusCode: 400,
          validationContext: "querystring",
        },
      },
      error: "Bad Request",
      message: "querystring.latitude: Latitude doit être comprise entre -90 et 90, querystring.longitude: Longitude doit être comprise entre -180 et 180",
      statusCode: 400,
    })
  })

  it("should perform search and return data", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v3/jobs/search?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(200)
    expect(data.jobs).toHaveLength(1)
    expect(data.recruiters).toHaveLength(1)
  })

  it("should support rncp param", async () => {
    const scope = nock("https://api.apprentissage.beta.gouv.fr").get(`/api/certification/v1`).query({ "identifiant.rncp": rncpQuery }).reply(200, [certification])

    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v3/jobs/search?rncp=${rncpQuery}&latitude=${latitude}&longitude=${longitude}`,
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
      path: `/api/v3/jobs/search?longitude=${longitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(400)
    expect(data).toEqual({
      statusCode: 400,
      error: "Bad Request",
      message: "querystring.latitude: latitude is required when longitude is provided",
      data: {
        validationError: {
          issues: [
            {
              code: "custom",
              path: ["latitude"],
              message: "latitude is required when longitude is provided",
            },
          ],
          name: "ZodError",
          statusCode: 400,
          code: "FST_ERR_VALIDATION",
          validationContext: "querystring",
        },
      },
    })
  })

  it("should require longitude when latitude is provided", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v3/jobs/search?latitude=${latitude}`,
      headers: { authorization: `Bearer ${token}` },
    })
    const data = response.json()
    expect(response.statusCode).toBe(400)
    expect(data).toEqual({
      data: {
        validationError: {
          code: "FST_ERR_VALIDATION",
          issues: [
            {
              code: "custom",
              message: "longitude is required when latitude is provided",
              path: ["longitude"],
            },
          ],
          name: "ZodError",
          statusCode: 400,
          validationContext: "querystring",
        },
      },
      error: "Bad Request",
      message: "querystring.longitude: longitude is required when latitude is provided",
      statusCode: 400,
    })
  })

  it("should all params be optional", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v3/jobs/search`,
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

  const data: IJobOfferApiWriteV3Input = {
    contract: { start: inSept.toJSON() },

    offer: {
      title: "Apprentis en développement web",
      rome_codes: ["M1602"],
      description: "Envie de devenir développeur web ? Rejoignez-nous !",
    },

    apply: { email: "mail@mail.com" },

    workplace: {
      siret: apiEntrepriseEtablissementFixture.dinum.data.siret,
    },
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
        features: [
          {
            geometry: parisFixture.centre,
            properties: generateFeaturePropertyFixture({
              city: parisFixture.nom,
              postcode: parisFixture.codesPostaux[0],
              name: "20 AVENUE DE SEGUR",
            }),
          },
        ],
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
      path: `/api/v3/jobs`,
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
      path: `/api/v3/jobs`,
      body: data,
      headers: { authorization: `Bearer ${restrictedToken}` },
    })

    expect.soft(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: "Forbidden", message: "Unauthorized", statusCode: 403 })
  })

  it("should create a new job offer", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: `/api/v3/jobs`,
      body: data,
      headers: { authorization: `Bearer ${token}` },
    })

    expect.soft(response.statusCode).toBe(200)
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
      path: `/api/v3/jobs`,
      body: {
        ...data,
        apply: {
          email: null,
          phone: null,
          url: null,
        },
      },
      headers: { authorization: `Bearer ${token}` },
    })

    expect.soft(response.statusCode).toBe(400)
    const responseJson = response.json()
    expect(responseJson).toEqual({
      data: {
        validationError: {
          code: "FST_ERR_VALIDATION",
          issues: [
            {
              code: "custom",
              message: "At least one of url, email, or phone is required",
              path: ["apply", "url"],
            },
            {
              code: "custom",
              message: "At least one of url, email, or phone is required",
              path: ["apply", "email"],
            },
            {
              code: "custom",
              message: "At least one of url, email, or phone is required",
              path: ["apply", "phone"],
            },
          ],
          name: "ZodError",
          statusCode: 400,
          validationContext: "body",
        },
      },
      error: "Bad Request",
      message:
        "body.apply.url: At least one of url, email, or phone is required, body.apply.email: At least one of url, email, or phone is required, body.apply.phone: At least one of url, email, or phone is required",
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

  const data: IJobOfferApiWriteV3Input = {
    contract: { start: inSept.toJSON() },

    offer: {
      title: "Apprentis en développement web",
      rome_codes: ["M1602"],
      description: "Envie de devenir développeur web ? Rejoignez-nous !",
    },

    apply: {
      email: "mail@mail.com",
    },

    workplace: {
      siret: apiEntrepriseEtablissementFixture.dinum.data.siret,
    },
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
        features: [
          {
            geometry: parisFixture.centre,
            properties: generateFeaturePropertyFixture({
              city: parisFixture.nom,
              postcode: parisFixture.codesPostaux[0],
              name: "20 AVENUE DE SEGUR",
            }),
          },
        ],
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
      path: `/api/v3/jobs/${id.toString()}`,
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
      path: `/api/v3/jobs/${id.toString()}`,
      body: data,
      headers: { authorization: `Bearer ${token}` },
    })

    expect.soft(response.statusCode).toBe(204)
    expect(await getDbCollection("jobs_partners").countDocuments({ _id: id })).toBe(1)
    const doc = await getDbCollection("jobs_partners").findOne({ _id: id })

    // Ensure that the job offer is associated to the correct permission
    expect(doc?.offer_title).toBe(data.offer.title)
    expect(doc).not.toEqual(originalJob)
  })

  it('should return 404 on "job does not exist"', async () => {
    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/v3/jobs/${new ObjectId().toString()}`,
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
      path: `/api/v3/jobs/${id.toString()}`,
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
      path: `/api/v3/jobs/${id.toString()}`,
      body: data,
      headers: { authorization: `Bearer ${restrictedToken}` },
    })

    expect.soft(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: "Forbidden", message: "Unauthorized", statusCode: 403 })
  })
})
