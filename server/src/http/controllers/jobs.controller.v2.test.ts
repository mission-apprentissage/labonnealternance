import { getApiApprentissageTestingToken } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { createJobPartnerTest, createRecruteurLbaTest } from "@tests/utils/user.test.utils"
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
    await createJobPartnerTest({ jobOfferData: { rome_code: rome }, workplaceData: { location: { address: "adresse", geopoint: geopoint } } })
    await createRecruteurLbaTest({ rome_codes: rome, geopoint: geopoint, siret: "58006820882692" })
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
      expect(!!data.jobs.length).toBe(true)
      expect(!!data.recruiters.length).toBe(true)
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
      // KBA 20240809 need API APPRENTISSAGE TESTING KEY TO WORK.
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
})
