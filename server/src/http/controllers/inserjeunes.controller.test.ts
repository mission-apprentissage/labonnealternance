import nock from "nock"
import { describe, expect, it, beforeEach } from "vitest"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

const OMOGEN_BASE_URL = "https://omogen-api-pr.phm.education.gouv.fr"

useMongo()

describe("InserJeunes Controller", () => {
  const httpClient = useServer()

  beforeEach(() => {
    nock.cleanAll()
  })

  describe("GET /inserjeunes/:zipcode/:cfd", () => {
    it("should return InserJeunes stats for valid zipcode and cfd", async () => {
      const mockToken = "mock-access-token"
      const mockStats = {
        millesime: "2023",
        taux_emploi_6_mois: 75,
        taux_poursuite_etudes: 20,
      }

      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, {
        access_token: mockToken,
        expires_in: 3600,
        token_type: "Bearer",
      })

      // Mock stats request
      nock(OMOGEN_BASE_URL).get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/75001/certifications/12345678").reply(200, mockStats)

      const response = await httpClient().inject({
        method: "GET",
        path: "/api/inserjeunes/75001/12345678",
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual(mockStats)
    })

    it("should return 404 when no data is available", async () => {
      const mockToken = "mock-access-token"

      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, {
        access_token: mockToken,
        expires_in: 3600,
        token_type: "Bearer",
      })

      // Mock 404 response
      nock(OMOGEN_BASE_URL).get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/75011/certifications/00000000").reply(404)

      const response = await httpClient().inject({
        method: "GET",
        path: "/api/inserjeunes/75011/00000000",
      })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({
        error: "Not Found",
        message: "Pas de données disponibles",
        statusCode: 404,
      })
    })
  })
})
