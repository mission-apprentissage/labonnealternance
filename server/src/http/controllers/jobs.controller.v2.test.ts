import { getApiApprentissageTestingToken } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { createRecruteurLbaTest, saveJobPartnerTest } from "@tests/utils/user.test.utils"
import { describe, expect, it } from "vitest"

import { ApiApprentissageTokenData } from "../../security/accessApiApprentissageService"

describe("/jobs", () => {
  const tokenPayload: ApiApprentissageTokenData = {
    email: "test@test.fr",
  }
  const rome = ["D1214", "D1212", "D1211"]
  const rncpQuery = "RNCP13620"
  const geopoint = { type: "Point", coordinates: [7.120835315436125, -45.16534931026399] as [number, number] }
  const romesQuery = rome.join(",")
  const [longitude, latitude] = geopoint.coordinates
  const token = getApiApprentissageTestingToken(tokenPayload)

  const mockData = async () => {
    await saveJobPartnerTest({ offer_rome_code: rome, workplace_geopoint: geopoint, apply_email: "email@mail.com" })
    await createRecruteurLbaTest({ rome_codes: rome, geopoint: geopoint, siret: "58006820882692", email: "email@mail.com" })
  }

  useMongo(mockData, "beforeAll")

  describe("/rome", () => {
    const httpClient = useServer()
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
        "offer_diploma_level",
        "offer_expiration",
        "offer_opening_count",
        "offer_rome_code",
        "offer_title",
        "offer_to_be_acquired_skills",
        "partner",
        "partner_job_id",
        "workplace_address",
        "workplace_description",
        "workplace_geopoint",
        "workplace_idcc",
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
        "workplace_address",
        "workplace_description",
        "workplace_geopoint",
        "workplace_idcc",
        "workplace_naf_code",
        "workplace_naf_label",
        "workplace_name",
        "workplace_opco",
        "workplace_siret",
        "workplace_size",
        "workplace_website",
      ])
    })
  })
  describe("/rncp", () => {
    const httpClient = useServer()
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
        "offer_diploma_level",
        "offer_expiration",
        "offer_opening_count",
        "offer_rome_code",
        "offer_title",
        "offer_to_be_acquired_skills",
        "partner",
        "partner_job_id",
        "workplace_address",
        "workplace_description",
        "workplace_geopoint",
        "workplace_idcc",
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
        "workplace_address",
        "workplace_description",
        "workplace_geopoint",
        "workplace_idcc",
        "workplace_naf_code",
        "workplace_naf_label",
        "workplace_name",
        "workplace_opco",
        "workplace_siret",
        "workplace_size",
        "workplace_website",
      ])
    })
  })
})
