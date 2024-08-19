import { getApiApprentissageTestingToken } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { createRecruteurLbaTest, saveJobPartnerTest } from "@tests/utils/user.test.utils"
import { describe, expect, it } from "vitest"

describe("/jobs", () => {
  const httpClient = useServer()
  const rome = ["D1214", "D1212", "D1211"]
  const rncpQuery = "RNCP13620"
  const geopoint = { type: "Point", coordinates: [7.120835315436125, -45.16534931026399] as [number, number] }
  const romesQuery = rome.join(",")
  const [longitude, latitude] = geopoint.coordinates

  const token = getApiApprentissageTestingToken({ email: "test@test.fr" })

  const mockData = async () => {
    await saveJobPartnerTest({ offer_rome_code: rome, workplace_geopoint: geopoint })
    await createRecruteurLbaTest({ rome_codes: rome, geopoint: geopoint, siret: "58006820882692" })
  }

  useMongo(mockData, "beforeAll")

  describe("/rome", () => {
    it("should return 401 if no api key provided", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rome" })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should return 401 if no api key is invalid", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rome", headers: { authorization: `Bearer ${token}invalid` } })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should throw ZOD error if ROME is not formatted correctly", async () => {
      const romesQuery = "D4354,D864,F67"
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rome?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const { data } = response.json()
      expect(response.statusCode).toBe(400)
      expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
    })
    it("should throw ZOD error if GEOLOCATION is not formatted correctly", async () => {
      const [latitude, longitude] = [300, 200]
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rome?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const { data } = response.json()
      expect(response.statusCode).toBe(400)
      expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
    })
    it("should perform search and return data", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rome?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const data = response.json()
      expect(response.statusCode).toBe(200)
      expect(!!data.jobs.length).toBe(true)
      expect(!!data.recruiters.length).toBe(true)
    })
  })
  describe.skip("/rncp", () => {
    it("should return 401 if no api key provided", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rncp" })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should return 401 if no api key is invalid", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rncp", headers: { authorization: `Bearer ${token}invalid` } })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should throw ZOD error if RNCP is not formatted correctly", async () => {
      const rncp = "RNCP13"
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rncp?rncp=${rncp}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const { data } = response.json()
      expect(response.statusCode).toBe(400)
      expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
    })
    it("should throw ZOD error if GEOLOCATION is not formatted correctly", async () => {
      const [latitude, longitude] = [300, 200]
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rncp?romes=${rncpQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const { data } = response.json()
      expect(response.statusCode).toBe(400)
      expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
    })
    it("should perform search and return data", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rncp?rncp=${rncpQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const data = response.json()
      expect(response.statusCode).toBe(200)
      expect(!!data.jobs.length).toBe(true)
      expect(!!data.recruiters.length).toBe(true)
    })
  })
  describe("/jobs", async () => {
    describe("POST API entry validation", () => {
      const validData = {
        workplace_siret: "12345678901234",
        contract_start: "2024-01-01",
        contract_duration: "12 months",
        offer_title: "Software Engineer",
        offer_description: "Develop and maintain software.",
        offer_diploma_level_label: "Bachelor's Degree",
      }

      const mandatoryFields = ["workplace_siret", "contract_start", "contract_duration", "offer_title", "offer_description", "offer_diploma_level_label"]

      describe.each(mandatoryFields)("Validation for missing %s", async (field) => {
        it(`should throw ZOD error if ${field} is missing`, async () => {
          const invalidData = { ...validData }
          delete invalidData[field]

          const response = await httpClient().inject({
            method: "POST",
            path: `/api/v2/jobs`,
            body: invalidData,
            headers: { authorization: `Bearer ${token}` },
          })

          const { data } = response.json()
          expect(response.statusCode).toBe(400)
          expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
        })
      })
    })
  })
})
