import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import assert from "assert"
import { ObjectId } from "mongodb"
import type { IApplication, IRoutes } from "shared"
import { generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersFull } from "shared/fixtures/jobPartners.fixture"
import { clichyFixture } from "shared/fixtures/referentiel/commune.fixture"
import { type IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import type z from "zod"
import { getDbCollection } from "@/common/utils/mongodbUtils"

describe("jobEtFormationV1", () => {
  useMongo()
  const httpClient = useServer()

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2024-08-21"))

    return () => {
      vi.useRealTimers()
    }
  })

  afterEach(async () => {
    await getDbCollection("jobs_partners").deleteMany({})
    await getDbCollection("applications").deleteMany({})
  })

  describe("Verifie que", async () => {
    it("la route répond", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations" })

      expect(response.statusCode).toBe(400)
    })

    it("la recherche répond", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=75056&caller=a",
      })

      expect(response.statusCode).toBe(200)
    })

    it("les requêtes sans ROME sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=&longitude=2.3752&latitude=48.845&radius=30&insee=75056" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("romes or rncp : You must specify at least 1 rome code or a rncp code.") >= 0)
    })

    it("les requêtes avec ROME mal formé sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=ABCDE&longitude=2.3752&latitude=48.845&radius=30&insee=75056" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234") >= 0)
    })

    it("les requêtes avec trop de ROME sont refusées", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: "/api/V1/jobsEtFormations?romes=A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234,A1234&longitude=2.3752&latitude=48.845&radius=30&insee=75056",
      })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("romes : Too many rome codes. Maximum is 20.") >= 0)
    })

    it("les requêtes sans caller sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=75056" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("caller : caller is missing.") >= 0)
    })

    it("les requêtes sans code insee sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("insee : insee city code is missing.") >= 0)
    })

    it("les requêtes avec code insee mal formé sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=ABCDE" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("insee : Badly formatted insee city code. Must be 5 digit number.") >= 0)
    })

    it("les requêtes sans radius sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&insee=12345" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("radius : Search radius is missing.") >= 0)
    })

    it("les requêtes avec radius mal formé sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=XX&insee=12345" })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({
        data: {
          validationError: {
            code: "FST_ERR_VALIDATION",
            issues: [
              {
                code: "invalid_type",
                expected: "number",
                message: "Expected number, received nan",
                path: ["radius"],
                received: "nan",
              },
            ],
            name: "ZodError",
            statusCode: 400,
            validationContext: "querystring",
          },
        },
        error: "Bad Request",
        message: "querystring.radius: Expected number, received nan",
        statusCode: 400,
      })
    })

    it("les requêtes avec radius hors limite sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=201&insee=12345" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("radius : Search radius must be a number between 0 and 200.") >= 0)
    })

    it("les requêtes sans latitude sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=&insee=12345" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("latitude : Search center latitude is missing.") >= 0)
    })

    it("les requêtes avec latitude mal formée sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=AX&insee=12345" })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({
        data: {
          validationError: {
            code: "FST_ERR_VALIDATION",
            issues: [
              {
                code: "invalid_type",
                expected: "number",
                message: "Expected number, received nan",
                path: ["latitude"],
                received: "nan",
              },
            ],
            name: "ZodError",
            statusCode: 400,
            validationContext: "querystring",
          },
        },
        error: "Bad Request",
        message: "querystring.latitude: Expected number, received nan",
        statusCode: 400,
      })
    })

    it("les requêtes avec latitude hors limites sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=91&insee=12345" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("latitude : Search center latitude must be a number between -90 and 90.") >= 0)
    })

    it("les requêtes sans longitude sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=&latitude=2.3752&insee=12345" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("longitude : Search center longitude is missing.") >= 0)
    })

    it("les requêtes avec longitude mal formée sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=AX&latitude=2.3752&insee=12345" })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({
        data: {
          validationError: {
            code: "FST_ERR_VALIDATION",
            issues: [
              {
                code: "invalid_type",
                expected: "number",
                message: "Expected number, received nan",
                path: ["longitude"],
                received: "nan",
              },
            ],
            name: "ZodError",
            statusCode: 400,
            validationContext: "querystring",
          },
        },
        error: "Bad Request",
        message: "querystring.longitude: Expected number, received nan",
        statusCode: 400,
      })
    })

    it("les requêtes avec longitude hors limites sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=181&latitude=90&insee=12345" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "wrong_parameters")
      assert.ok(JSON.parse(response.body).error_messages.indexOf("longitude : Search center longitude must be a number between -180 and 180.") >= 0)
    })

    it("les requêtes avec sources mal formée sont refusées", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: "/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=180&latitude=90&insee=12345&sources=lba,lbc",
      })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(
        JSON.parse(response.body).message,
        "querystring.sources: Invalid source format. Must be a comma-separated list of valid sources of formation,matcha,lba,lbb,offres,peJob,partnerJob"
      )
    })

    it("les requêtes avec diploma mal formée sont refusées", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=180&latitude=90&diploma=lba,lbc" })

      expect(response.statusCode).toBe(400)
      assert.deepStrictEqual(JSON.parse(response.body).error, "Bad Request")
      assert.ok(JSON.parse(response.body).message.indexOf("querystring.diploma: Invalid enum value") >= 0)
    })

    it("la route renvoie les bonnes données", async () => {
      const romes = ["D1214", "D1212", "D1211"]
      const recruteurLba = generateJobsPartnersFull({
        partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        offer_rome_codes: romes,
        workplace_geopoint: clichyFixture.centre,
        workplace_siret: "58006820882692",
        apply_email: "email@mail.com",
      })
      const jobPartnerOffer: IJobsPartnersOfferPrivate = generateJobsPartnersFull({
        _id: new ObjectId("69de59614efad14044066af4"),
        partner_job_id: "69de59614efad14044066af5",
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        offer_rome_codes: romes,
        workplace_geopoint: clichyFixture.centre,
      })
      const FTOffer: IJobsPartnersOfferPrivate = generateJobsPartnersFull({
        _id: new ObjectId(),
        partner_job_id: "69de59614efad14044066af6",
        partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL,
        offer_rome_codes: romes,
        workplace_geopoint: clichyFixture.centre,
      })
      const lbaOffer: IJobsPartnersOfferPrivate = generateJobsPartnersFull({
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        offer_rome_codes: romes,
        workplace_geopoint: clichyFixture.centre,
      })
      await getDbCollection("jobs_partners").insertMany([recruteurLba, jobPartnerOffer, lbaOffer, FTOffer])

      const lbaApplication: IApplication = generateApplicationFixture({
        job_id: lbaOffer._id,
      })
      await getDbCollection("applications").insertMany([lbaApplication])

      const [longitude, latitude] = clichyFixture.centre.coordinates
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/V1/jobsEtFormations?romes=${romes.join(",")}&longitude=${longitude}&latitude=${latitude}&radius=30&insee=92024&caller=a`,
      })

      expect.soft(response.statusCode).toBe(200)

      type ResponseBody = z.output<IRoutes["get"]["/v1/jobsEtFormations"]["response"]["200"]>

      const { jobs, formations } = response.json() as ResponseBody
      if (jobs && "matchas" in jobs) {
        const { lbaCompanies: lbaCompaniesRaw = null, matchas: lbaJobsRaw = null, partnerJobs: partnerJobsRaw = null, peJobs: peJobsRaw = null } = jobs
        ;[lbaCompaniesRaw, lbaJobsRaw, partnerJobsRaw, peJobsRaw].forEach((result) => {
          if (result && "results" in result) {
            const { results } = result
            results.forEach((job) => {
              delete job.id
              delete job.job?.id
              delete job.recipient_id
              delete job.token
              delete job.contact.email
              delete job.contact.iv
            })
          }
        })
      }
      expect.soft({ jobs, formations }).toMatchSnapshot()
    })
  })
})
